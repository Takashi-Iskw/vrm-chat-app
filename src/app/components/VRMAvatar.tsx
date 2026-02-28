// components/VRMAvatar.tsx
"use client";

import { ReactNode, Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { VRM, VRMUtils, VRMLoaderPlugin } from "@pixiv/three-vrm";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import * as THREE from "three";

type VRMAvatarProps = {
  // 0〜1くらいを想定（口パク用）
  mouthOpen?: number;
  children?: ReactNode;
};

function ImageBackground() {
  const { scene } = useThree();
  // const texture = useLoader(THREE.TextureLoader, "/bg/office.png");
  const texture = useLoader(THREE.TextureLoader, "/bg/bar.png");

  useEffect(() => {
    // シーン全体の背景にテクスチャを設定
    scene.background = texture;

    return () => {
      // アンマウント時に戻しておく
      scene.background = null;
    };
  }, [scene, texture]);

  return null;
}

function VRMModel({ mouthOpen = 0 }: { mouthOpen?: number }) {
  const timeRef = useRef(0);
  const restPoseAppliedRef = useRef(false);

  const gltf = useLoader(
    GLTFLoader,
    "/vrm/Nova.vrm",
    (loader: GLTFLoader) => {
      loader.register((parser: any) => new VRMLoaderPlugin(parser));
    }
  ) as any;

  const vrm = useMemo(() => {
    const loadedVRM = gltf.userData.vrm as VRM | undefined;
    if (!loadedVRM) return null;

    VRMUtils.removeUnnecessaryJoints(loadedVRM.scene);

    // 画面内の位置調整（ベース位置）
    loadedVRM.scene.position.set(0, -0.1, -0.0);

    // --- Tポーズを軽めのアイドル立ちにする ---
    // ここでは姿勢を適用しない（vrm.updateで正規化が走るため）

    // console.log("VRM loaded", loadedVRM);
    return loadedVRM;
  }, [gltf]);

  useFrame((_, delta) => {
    if (!vrm) return;

    timeRef.current += delta;
    const t = timeRef.current;

    // --- 全身を微妙に揺らす ---
    const baseY = -0.2;
    // const bob = Math.sin(t * 1.2) * 0.03; // 上下
    const swayX = Math.sin(t * 0.7) * 0.005; // 前後
    const swayZ = Math.sin(t * 1.5) * 0.002; // 左右傾き

    // vrm.scene.position.y = baseY + bob;
    vrm.scene.rotation.x = swayX;
    vrm.scene.rotation.z = swayZ;

    // --- ③ 口パク＋表情のランダム微揺れ ---
    if (vrm.expressionManager) {
      const v = Math.max(0, Math.min(1, mouthOpen ?? 0));

      // 口の開き（あ）
      vrm.expressionManager.setValue("aa", v);

      // 軽いまばたき（常時）
      const blinkBase = (Math.sin(t * 0.8) + 1) / 2; // 0〜1
      const blink = blinkBase * 0.08; // 0〜0.2 くらいに抑える
      vrm.expressionManager.setValue("blink", blink);

      // しゃべってる時だけ表情ちょっと豊かに
      let joy = 0.03; // デフォはごく弱め
    //   if (v > 0.05) {
        const jitter = (Math.random() - 0.5) * 0.1; // -0.05〜0.05
        joy = 0.25 + v * 0.4 + jitter;
    //   }
      joy = Math.max(0, Math.min(0.9, joy));

      // 表情制御
      // vrm.expressionManager.setValue("happy", joy);
      // vrm.expressionManager.setValue("angry", joy);
      // vrm.expressionManager.setValue("sad", joy);
      // console.log(vrm.expressionManager)
    }

    vrm.update(delta);

    // --- Tポーズを軽めのアイドル立ちにする ---
    // autoUpdateHumanBonesが有効だとRawは上書きされるため、Normalizedに適用する
    if (!restPoseAppliedRef.current) {
      const humanoid = vrm.humanoid;
      if (humanoid && "getNormalizedBoneNode" in humanoid) {
        const leftUpperArm = humanoid.getNormalizedBoneNode("leftUpperArm" as any);
        const rightUpperArm = humanoid.getNormalizedBoneNode("rightUpperArm" as any);
        const leftLowerArm = humanoid.getNormalizedBoneNode("leftLowerArm" as any);
        const rightLowerArm = humanoid.getNormalizedBoneNode("rightLowerArm" as any);
        const spine = humanoid.getNormalizedBoneNode("spine" as any);
        const hips = humanoid.getNormalizedBoneNode("hips" as any);

        // ちょっとリラックスした立ち方
        if (hips) {
          hips.rotation.y = THREE.MathUtils.degToRad(3);
        }
        if (spine) {
          spine.rotation.x = THREE.MathUtils.degToRad(-5);
        }
        
        // 腕を下ろして自然に体の横へ
        if (leftUpperArm) {
          leftUpperArm.rotation.z = THREE.MathUtils.degToRad(-55);
          leftUpperArm.rotation.x = THREE.MathUtils.degToRad(-8);
          leftUpperArm.rotation.y = THREE.MathUtils.degToRad(8);
        }
        if (rightUpperArm) {
          rightUpperArm.rotation.z = THREE.MathUtils.degToRad(55);
          rightUpperArm.rotation.x = THREE.MathUtils.degToRad(-8);
          rightUpperArm.rotation.y = THREE.MathUtils.degToRad(-8);
        }
        if (leftLowerArm) {
          leftLowerArm.rotation.z = THREE.MathUtils.degToRad(-12);
          leftLowerArm.rotation.x = THREE.MathUtils.degToRad(-3);
        }
        if (rightLowerArm) {
          rightLowerArm.rotation.z = THREE.MathUtils.degToRad(12);
          rightLowerArm.rotation.x = THREE.MathUtils.degToRad(-3);
        }
      }
      restPoseAppliedRef.current = true;
    }
  });

  if (!vrm) return null;

  return <primitive object={vrm.scene} />;
}

export default function VRMAvatar({ mouthOpen = 0, children }: VRMAvatarProps) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1450,
        aspectRatio: "16 / 9",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
        position: "relative",
      }}
    >
      <Canvas
        camera={{
          position: [0, 1.4, 2],
          fov: 25,
        }}
      >
        <ImageBackground />

        <ambientLight intensity={0.6} />
        <directionalLight position={[1, 1, 1]} intensity={0.8} />
        <Suspense fallback={null}>
          <VRMModel mouthOpen={mouthOpen} />
        </Suspense>
        <OrbitControls
          target={[0, 1.4, 0]}
          enablePan={false}
          enableRotate={false}
          minDistance={0.7}
          maxDistance={0.7}
        />
      </Canvas>

      {children && (
        <div
          style={{
            position: "absolute",
            right: 24,
            bottom: 24,
            pointerEvents: "none", // Canvasのドラッグ邪魔しないように
          }}
        >
          <div style={{ pointerEvents: "auto" }}>{children}</div>
        </div>
      )}
    </div>
  );
}





