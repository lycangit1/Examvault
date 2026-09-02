import { liquidMetalFragmentShader, ShaderMount } from "@paper-design/shaders";
import { Sparkles } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

export interface LiquidMetalButtonProps {
  label?: string;
  onClick?: () => void;
  viewMode?: "text" | "icon";
  className?: string;
  icon?: React.ReactNode;
  theme?: "navy" | "dark" | "silver" | "emerald" | "amber" | "rose";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  active?: boolean;
}

export function LiquidMetalButton({
  label = "Get Started",
  onClick,
  viewMode = "text",
  className = "",
  icon,
  theme = "navy",
  disabled = false,
  type = "button",
  size = "md",
  fullWidth = false,
  active = false,
}: LiquidMetalButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<
    Array<{ x: number; y: number; id: number }>
  >([]);
  const shaderRef = useRef<HTMLDivElement>(null);
  // biome-ignore lint/suspicious/noExplicitAny: External library without types
  const shaderMount = useRef<any>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleId = useRef(0);

  // Calculate dimensions based on size, viewMode, and fullWidth
  const dimensions = useMemo(() => {
    const isSmall = size === "sm";
    const height = isSmall ? 28 : size === "lg" ? 48 : 42;
    const innerHeight = height - 4;

    if (viewMode === "icon") {
      return {
        width: height,
        height,
        innerWidth: innerHeight,
        innerHeight,
        shaderWidth: height,
        shaderHeight: height,
      };
    } else {
      const calculatedWidth = isSmall
        ? Math.max(78, Math.min(130, label.length * 7.5 + 20))
        : Math.max(130, Math.min(380, label.length * 9 + 40));

      return {
        width: fullWidth ? "100%" : `${calculatedWidth}px`,
        height: `${height}px`,
        innerWidth: fullWidth ? "calc(100% - 4px)" : `${calculatedWidth - 4}px`,
        innerHeight: `${innerHeight}px`,
        shaderWidth: fullWidth ? "100%" : `${calculatedWidth}px`,
        shaderHeight: `${height}px`,
        isSmall,
      };
    }
  }, [viewMode, label, size, fullWidth]);

  useEffect(() => {
    const styleId = "shader-canvas-style-exploded";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .shader-container-exploded canvas {
          width: 100% !important;
          height: 100% !important;
          display: block !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          border-radius: 100px !important;
        }
        @keyframes ripple-animation {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0.4;
          }
          100% {
            transform: translate(-50%, -50%) scale(3.5);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    const loadShader = async () => {
      try {
        if (shaderRef.current) {
          if (shaderMount.current?.destroy) {
            shaderMount.current.destroy();
          }

          // Subtle, calm, soft shader configuration
          let shaderConfig = {
            u_repetition: 2,
            u_softness: 0.85,
            u_shiftRed: 0.05,
            u_shiftBlue: 0.25,
            u_distortion: 0.01,
            u_contour: 0,
            u_angle: 45,
            u_scale: 12,
            u_shape: 1,
            u_offsetX: 0.05,
            u_offsetY: -0.05,
          };

          if (theme === "silver") {
            shaderConfig = {
              u_repetition: 2,
              u_softness: 0.9,
              u_shiftRed: 0.05,
              u_shiftBlue: 0.08,
              u_distortion: 0.008,
              u_contour: 0,
              u_angle: 30,
              u_scale: 14,
              u_shape: 1,
              u_offsetX: 0.0,
              u_offsetY: 0.0,
            };
          } else if (theme === "dark") {
            shaderConfig = {
              u_repetition: 2,
              u_softness: 0.8,
              u_shiftRed: 0.1,
              u_shiftBlue: 0.1,
              u_distortion: 0.01,
              u_contour: 0,
              u_angle: 45,
              u_scale: 12,
              u_shape: 1,
              u_offsetX: 0.05,
              u_offsetY: -0.05,
            };
          }

          // Slower, graceful ambient speed (0.18 idle)
          shaderMount.current = new ShaderMount(
            shaderRef.current,
            liquidMetalFragmentShader,
            shaderConfig,
            undefined,
            active ? 0.28 : 0.18,
          );
        }
      } catch (error) {
        console.error("[LiquidMetalButton] Failed to load shader:", error);
      }
    };

    loadShader();

    return () => {
      if (shaderMount.current?.destroy) {
        shaderMount.current.destroy();
        shaderMount.current = null;
      }
    };
  }, [theme, active]);

  const handleMouseEnter = () => {
    if (disabled) return;
    setIsHovered(true);
    shaderMount.current?.setSpeed?.(0.55);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPressed(false);
    shaderMount.current?.setSpeed?.(active ? 0.28 : 0.18);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (shaderMount.current?.setSpeed) {
      shaderMount.current.setSpeed(1.2);
      setTimeout(() => {
        if (isHovered) {
          shaderMount.current?.setSpeed?.(0.55);
        } else {
          shaderMount.current?.setSpeed?.(active ? 0.28 : 0.18);
        }
      }, 300);
    }

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ripple = { x, y, id: rippleId.current++ };

      setRipples((prev) => [...prev, ripple]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
      }, 500);
    }

    onClick?.();
  };

  const isSmall = size === "sm";

  return (
    <div className={`relative ${fullWidth ? "w-full block" : "inline-block"} ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${className}`}>
      <div
        style={{
          perspective: "1000px",
          perspectiveOrigin: "50% 50%",
          width: fullWidth ? "100%" : "auto",
        }}
      >
        <div
          style={{
            position: "relative",
            width: typeof dimensions.width === "number" ? `${dimensions.width}px` : dimensions.width,
            height: typeof dimensions.height === "number" ? `${dimensions.height}px` : dimensions.height,
            transformStyle: "preserve-3d",
            transition:
              "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.3s ease, height 0.3s ease",
            transform: "none",
          }}
        >
          {/* Content Layer (Text / Icon) */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: isSmall ? "4px" : "8px",
              transformStyle: "preserve-3d",
              transition:
                "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.3s ease, height 0.3s ease, gap 0.3s ease",
              transform: "translateZ(14px)",
              zIndex: 30,
              pointerEvents: "none",
              padding: isSmall ? "0 8px" : "0 14px",
            }}
          >
            {viewMode === "icon" ? (
              icon || (
                <Sparkles
                  size={isSmall ? 13 : 17}
                  style={{
                    color: active ? "#ffffff" : "#cbd5e1",
                    filter: "drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.5))",
                    transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                />
              )
            ) : (
              <>
                {icon}
                <span
                  style={{
                    fontSize: isSmall ? "11px" : "13.5px",
                    color: active ? "#ffffff" : theme === "silver" ? "#334155" : "#ffffff",
                    fontWeight: 600,
                    letterSpacing: isSmall ? "0.03em" : "0.015em",
                    textShadow: active || theme !== "silver" ? "0px 1px 2px rgba(0, 0, 0, 0.6)" : "none",
                    transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    transform: "scale(1)",
                    whiteSpace: "nowrap",
                    fontFamily: isSmall ? "JetBrains Mono, monospace" : "inherit",
                  }}
                >
                  {label}
                </span>
              </>
            )}
          </div>

          {/* Inner Depth Card */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              transformStyle: "preserve-3d",
              transition:
                "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.3s ease, height 0.3s ease",
              transform: `translateZ(6px) ${isPressed ? "translateY(1px) scale(0.99)" : "translateY(0) scale(1)"}`,
              zIndex: 20,
            }}
          >
            <div
              style={{
                width: dimensions.innerWidth,
                height: dimensions.innerHeight,
                margin: "2px",
                borderRadius: "100px",
                background: active
                  ? "linear-gradient(180deg, #00236f 0%, #00123d 100%)"
                  : theme === "silver"
                  ? "linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)"
                  : "linear-gradient(180deg, #002166 0%, #00133a 100%)",
                boxShadow: isPressed
                  ? "inset 0px 1px 3px rgba(0, 0, 0, 0.4)"
                  : active
                  ? "inset 0px 1px 1px rgba(255, 255, 255, 0.3)"
                  : theme === "silver"
                  ? "inset 0px 1px 0px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0,0,0,0.04)"
                  : "inset 0px 1px 1px rgba(255, 255, 255, 0.2)",
                border: theme === "silver" && !active ? "1px solid #e2e8f0" : "none",
                transition:
                  "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.3s ease, height 0.3s ease, box-shadow 0.15s ease",
              }}
            />
          </div>

          {/* Shader Canvas Outer Capsule */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              transformStyle: "preserve-3d",
              transition:
                "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.3s ease, height 0.3s ease",
              transform: `translateZ(0px) ${isPressed ? "translateY(1px) scale(0.99)" : "translateY(0) scale(1)"}`,
              zIndex: 10,
              opacity: theme === "silver" && !active ? 0.35 : 0.65,
            }}
          >
            <div
              style={{
                height: dimensions.shaderHeight,
                width: dimensions.shaderWidth,
                borderRadius: "100px",
                boxShadow: active
                  ? "0px 0px 0px 1px rgba(0, 35, 111, 0.6), 0px 2px 8px rgba(0, 35, 111, 0.25)"
                  : isHovered
                  ? "0px 0px 0px 1px rgba(0, 35, 111, 0.35), 0px 3px 6px rgba(0, 35, 111, 0.12)"
                  : "0px 0px 0px 1px rgba(0, 0, 0, 0.08)",
                transition:
                  "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.3s ease, height 0.3s ease, box-shadow 0.15s ease",
                background: "rgb(0 0 0 / 0)",
              }}
            >
              <div
                ref={shaderRef}
                className="shader-container-exploded"
                style={{
                  borderRadius: "100px",
                  overflow: "hidden",
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  transition: "width 0.3s ease, height 0.3s ease",
                }}
              />
            </div>
          </div>

          {/* Interactive Trigger Button */}
          <button
            ref={buttonRef}
            type={type}
            disabled={disabled}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={() => !disabled && setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "transparent",
              border: "none",
              cursor: disabled ? "not-allowed" : "pointer",
              outline: "none",
              zIndex: 40,
              transformStyle: "preserve-3d",
              transform: "translateZ(18px)",
              transition:
                "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.3s ease, height 0.3s ease",
              overflow: "hidden",
              borderRadius: "100px",
            }}
            aria-label={label}
          >
            {ripples.map((ripple) => (
              <span
                key={ripple.id}
                style={{
                  position: "absolute",
                  left: `${ripple.x}px`,
                  top: `${ripple.y}px`,
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 70%)",
                  pointerEvents: "none",
                  animation: "ripple-animation 0.5s ease-out",
                }}
              />
            ))}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LiquidMetalButton;
