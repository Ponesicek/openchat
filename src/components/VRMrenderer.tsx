"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRM, VRMUtils } from "@pixiv/three-vrm";
import {
  VRMAnimation,
  VRMAnimationLoaderPlugin,
  VRMLookAtQuaternionProxy,
  createVRMAnimationClip,
} from "@pixiv/three-vrm-animation";

export interface VRMRendererProps {
  modelUrl?: string;
  animationUrl?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function VRMRenderer({
  modelUrl = "/api/vrm/AvatarSample_B.vrm",
  animationUrl = "/api/vrm/VRMA_01.vrma",
  className,
  style,
}: VRMRendererProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  useEffect(() => {
    // #region THREE.js initialization
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene(); // scene
    scene.background = new THREE.Color(0xffffff);
    scene.add(new THREE.AmbientLight(0xffffff, 4)); // ambient light

    const camera = new THREE.PerspectiveCamera( // camera
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      20,
    );
    camera.position.set(0, 1.4, 1.5); // Left/right, up/down, forward/backward

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // renderer
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    // Improve material stability and color correctness for MToon/VRM materials
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.sortObjects = true;
    container.appendChild(renderer.domElement);
    // #endregion

    const loader = new GLTFLoader(); // VRM loader
    loader.register((parser) => new VRMLoaderPlugin(parser)); // register VRM loader plugin
    loader.register((parser) => new VRMAnimationLoaderPlugin(parser)); // register VRMA loader plugin

    let currentVRM: VRM | undefined = undefined;
    let currentVRMAnimation: VRMAnimation | undefined = undefined;
    let disposeMixer: (() => void) | null = null;

    loader.load(
      modelUrl, // model URL
      (gltf) => {
        // called when the resource is loaded
        const vrm: VRM = gltf.userData.vrm;
        if (vrm == null) {
          return;
        }
        // calling these functions greatly improves the performance
        VRMUtils.removeUnnecessaryVertices(gltf.scene);
        VRMUtils.combineSkeletons(gltf.scene);

        if (currentVRM) {
          scene.remove(currentVRM.scene);
          VRMUtils.deepDispose(currentVRM.scene);
        }

        // Add look at quaternion proxy to the VRM; which is needed to play the look at animation
        const lookAtQuatProxy = new VRMLookAtQuaternionProxy(vrm.lookAt!);
        lookAtQuatProxy.name = "lookAtQuaternionProxy";
        vrm.scene.add(lookAtQuatProxy);

        // Disable frustum culling
        vrm.scene.traverse((obj) => {
          obj.frustumCulled = false;
        });

        currentVRM = vrm;
        scene.add(vrm.scene);

        // rotate if the VRM is VRM0.0
        VRMUtils.rotateVRM0(vrm);

        if (currentVRM && currentVRMAnimation) {
          if (mixerRef.current) {
            try {
              mixerRef.current.stopAllAction();
            } catch (error) {
              console.error("Error stopping all actions in AnimationMixer:", error);
            }
          }

          mixerRef.current = new THREE.AnimationMixer(currentVRM.scene);

          const clip = createVRMAnimationClip(currentVRMAnimation, currentVRM);
          mixerRef.current.clipAction(clip).play();
          mixerRef.current.timeScale = 1;

          currentVRM.humanoid.resetNormalizedPose();
          // currentVRM.expressions.resetAll(); // will implement later
          currentVRM.lookAt?.reset();
          if (currentVRM.lookAt) {
            currentVRM.lookAt.autoUpdate =
              currentVRMAnimation.lookAtTrack != null;
          }
        }

        console.log(vrm);
      },
      undefined,
      (error) => {
        console.error("Failed to load VRM:", error);
      },
    );

    // If an animation is provided, load and play it once the model is ready
    loader.load(
      animationUrl,
      (animGltf) => {
        const VRMAnimations = animGltf.userData.vrmAnimations ?? [];
        if (VRMAnimations == null) {
          return;
        }

        currentVRMAnimation = VRMAnimations[0] ?? null;
        if (currentVRM && currentVRMAnimation) {
          if (mixerRef.current) {
            try {
              mixerRef.current.stopAllAction();
            } catch (error) {
              console.error("Error stopping all actions in mixerRef.current:", error);
            }
          }

          mixerRef.current = new THREE.AnimationMixer(currentVRM.scene);

          const clip = createVRMAnimationClip(currentVRMAnimation, currentVRM);
          mixerRef.current.clipAction(clip).play();
          mixerRef.current.timeScale = 1;

          currentVRM.humanoid.resetNormalizedPose();
          // currentVrm.expressions.resetAll(); // will implement later
          currentVRM.lookAt?.reset();
          if (currentVRM.lookAt) {
            currentVRM.lookAt.autoUpdate =
              currentVRMAnimation.lookAtTrack != null;
          }
        }
        console.log(VRMAnimations);
      },
      undefined,
      (error) => {
        console.error("Failed to load VRMA:", error);
      },
    );

    const clock = new THREE.Clock();
    clock.start();
    const renderLoop = () => {
      // Store frame id so we can cancel on cleanup when props change
      animationFrameRef.current = requestAnimationFrame(renderLoop);
      const deltaTime = clock.getDelta();

      if (mixerRef.current) {
        mixerRef.current.update(deltaTime);
      }

      if (currentVRM) {
        currentVRM.update(deltaTime);
        if (currentVRM.lookAt) {
          currentVRM.lookAt.lookAt(camera.position);
        }
      }

      renderer.render(scene, camera);
    };
    renderLoop();

    return () => {
      try {
        // cancel any pending animation frame to avoid multiple loops
        if (animationFrameRef.current != null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        if (mixerRef.current) {
          try {
            mixerRef.current.stopAllAction();
          } catch {}
        }
        mixerRef.current = null;
        renderer.dispose();
        container.removeChild(renderer.domElement);
      } catch {
        // ignore cleanup errors
      }
    };
  }, [modelUrl, animationUrl]);

  return (
    <div ref={containerRef} className={`${className} relative h-full w-full`} />
  );
}
