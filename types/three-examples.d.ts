// types/three-examples.d.ts
declare module "three/examples/jsm/loaders/GLTFLoader.js" {
  export class GLTFLoader {
    load(
      url: string,
      onLoad: (gltf: any) => void,
      onProgress?: (event: ProgressEvent<EventTarget>) => void,
      onError?: (event: unknown) => void
    ): void;

    register(pluginFactory: (parser: any) => any): void;
  }

  export interface GLTF {
    scene: any;
    [key: string]: any;
  }
}
