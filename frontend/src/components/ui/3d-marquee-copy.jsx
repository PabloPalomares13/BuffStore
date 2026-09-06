"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
export const ThreeDMarquee = ({ images = [], className }) => {
  // 1. Filtrar URLs válidas
  const rawImages = images.filter((img) => typeof img === "string" && img.trim() !== "");

  // 2. Si la base de datos trae pocas imágenes, las duplicamos para que la cuadrícula
  // tenga suficiente volumen (mínimo 16) y no se descuadre la posición 3D
  let displayImages = rawImages;
  if (rawImages.length > 0 && rawImages.length < 16) {
    const repeatCount = Math.ceil(16 / rawImages.length);
    displayImages = Array(repeatCount).fill(rawImages).flat();
  }

  // 3. Dividir en 4 columnas
  const chunkSize = Math.max(1, Math.ceil(displayImages.length / 4));
  const chunks = Array.from({ length: 4 }, (_, colIndex) => {
    const start = colIndex * chunkSize;
    return displayImages.slice(start, start + chunkSize);
  });

  return (
    <div
      className={cn(
        "mx-auto block h-[600px] overflow-hidden rounded-2xl max-sm:h-100 bg-gradient-to-r from-[#00FF37]/30 via-[#000000] to-[#FF137A]/30",
        className,
      )}
    >
      <div className="flex size-full items-center justify-center">
        <div className="perspective-1000 flex h-full w-full items-center justify-center">
          <div
            style={{
              transform: "rotateX(45deg) rotateY(0deg) rotateZ(-35deg)",
              transformStyle: "preserve-3d",
            }}
            className="relative top-[15%] -left-[40%] scale-110 sm:top-[20%] sm:-left-[25%] sm:scale-75 md:top-96 md:left-[-15%] md:scale-100 grid size-full origin-top-left grid-cols-4 gap-8 transform-3d"
            //className="relative top-10 left-[-5%] scale-50 sm:top-16 sm:left-[-5%] sm:scale-65 md:top-96 md:left-[-15%] md:scale-100 grid size-full origin-center grid-cols-4 gap-8 transform-3d"
          >
            {chunks.map((subarray, colIndex) => (
              <motion.div
                animate={{ y: colIndex % 2 === 0 ? 100 : -100 }}
                transition={{
                  duration: colIndex % 2 === 0 ? 10 : 15,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                key={colIndex + "marquee"}
                className="flex flex-col items-start gap-8"
              >
                {/* Línea vertical intacta */}
                <GridLineVertical className="-left-4" offset="80px" />

                {subarray.map((image, imageIndex) => (
                  <div className="relative" key={`${colIndex}-${imageIndex}-${image}`}>
                    {/* Línea horizontal intacta */}
                    <GridLineHorizontal className="-top-4" offset="20px" />

                    <motion.img
                      whileHover={{
                        y: -10,
                      }}
                      transition={{
                        duration: 0.3,
                        ease: "easeInOut",
                      }}
                      src={image}
                      alt={`Image ${imageIndex + 1}`}
                      className="aspect-[970/700] rounded-lg object-cover ring ring-gray-950/5 hover:shadow-2xl"
                      width={970}
                      height={700}
                    />
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const GridLineHorizontal = ({
  className,
  offset
}) => {
  return (
    <div
      style={
        {
          "--background": "#000000",
          "--color": "rgba(255, 255, 255, 0.84)",
          "--height": "1px",
          "--width": "5px",
          "--fade-stop": "90%",

          //-100px if you want to keep the line inside
          "--offset": offset || "200px",

          "--color-dark": "rgba(255, 255, 255, 0.2)",
          maskComposite: "exclude"
        }
      }
      className={cn(
        "absolute left-[calc(var(--offset)/2*-1)] h-[var(--height)] w-[calc(100%+var(--offset))]",
        "bg-[linear-gradient(to_right,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "[background-size:var(--width)_var(--height)]",
        "[mask:linear-gradient(to_left,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_right,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
        "[mask-composite:exclude]",
        "z-30",
        "dark:bg-[linear-gradient(to_right,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]",
        className,
      )}
    ></div>
  );
};

const GridLineVertical = ({
  className,
  offset
}) => {
  return (
    <div
      style={
        {
          "--background": "#000000",
          "--color": "rgba(255, 250, 250, 0.9)",
          "--height": "5px",
          "--width": "1px",
          "--fade-stop": "90%",

          //-100px if you want to keep the line inside
          "--offset": offset || "150px",

          "--color-dark": "rgba(255, 255, 255, 0.2)",
          maskComposite: "exclude"
        }
      }
      className={cn(
        "absolute top-[calc(var(--offset)/2*-1)] h-[calc(100%+var(--offset))] w-[var(--width)]",
        "bg-[linear-gradient(to_bottom,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "[background-size:var(--width)_var(--height)]",
        "[mask:linear-gradient(to_top,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_bottom,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
        "[mask-composite:exclude]",
        "z-30",
        "dark:bg-[linear-gradient(to_bottom,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]",
        className,
      )}
    ></div>
  );
};
