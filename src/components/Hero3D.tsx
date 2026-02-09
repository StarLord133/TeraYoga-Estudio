import * as React from 'react';
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF, Html, useProgress } from '@react-three/drei';

/**
 * Loader minimalista para no romper la estética durante la carga
 */
const Loader = () => {
    const { progress } = useProgress();
    return (
        <Html center>
            <div className="text-[#8a7f96] font-serif italic text-sm tracking-widest bg-white/40 backdrop-blur-sm px-4 py-2 rounded-full border border-[#8a7f96]/10">
                {progress.toFixed(0)}%
            </div>
        </Html>
    );
};

/**
 * Componente de Modelo 3D (Buda3D)
 */
const Model = () => {
    const { scene } = useGLTF('/models/buda3D_converted.glb');

    React.useEffect(() => {
        return () => {
            scene.traverse((object: any) => {
                if (object.isMesh) {
                    object.geometry.dispose();
                    if (object.material.isMaterial) {
                        object.material.dispose();
                    }
                }
            });
        };
    }, [scene]);

    return <primitive object={scene} scale={1.5} />;
};

/**
 * Hero3D - Contenedor del Canvas
 * Ajustado para fondo claro y rotación solo horizontal (polar lock)
 */
export const Hero3D = ({ children }: { children: React.ReactNode }) => {
    return (
        <section id="inicio" className="relative w-full min-h-screen bg-[#ffffff] overflow-hidden flex flex-col md:flex-row items-center">

            {/* Contenedor del Modelo (Izquierda) */}
            <div className="w-full md:w-1/2 h-[50vh] md:h-screen relative z-10 pt-20 md:pt-0">
                <Canvas
                    shadows
                    dpr={[1, 2]}
                    camera={{ position: [0, 0, 5], fov: 40 }}
                    gl={{ antialias: true, alpha: true }}
                >
                    <Suspense fallback={<Loader />}>
                        <Stage intensity={0.5} environment="city" shadows={{ type: 'contact', blur: 2, opacity: 0.5 }}>
                            <Model />
                        </Stage>
                        <OrbitControls
                            enableZoom={false}
                            autoRotate
                            autoRotateSpeed={0.8}
                            enablePan={false}
                            minPolarAngle={Math.PI / 2}
                            maxPolarAngle={Math.PI / 2}
                        />
                    </Suspense>
                </Canvas>
            </div>

            {/* Contenedor del Contenido Original (Derecha) */}
            <div className="w-full md:w-1/2 flex flex-col justify-center px-6 md:px-12 lg:px-20 z-20">
                {children}
            </div>

            {/* Fondo decorativo sutil para fondo claro */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#e1f2f3]/30 via-transparent to-transparent pointer-events-none z-0" />
        </section>
    );
};

export default Hero3D;
