import React, { forwardRef, useCallback, useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import ViewShot from "react-native-view-shot";

const A4_WIDTH = 595;
const A4_HEIGHT = 842;

interface ResumeCanvasProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
}

/**
 * ResumeCanvas implements the "Canva Approach" to resume rendering in React Native.
 */
export const ResumeCanvas = forwardRef<ViewShot, ResumeCanvasProps>(
  ({ children, width = 595, height = 842 }, ref) => {
    const [scale, setScale] = useState(1);

    const onLayout = useCallback((e: LayoutChangeEvent) => {
      const containerWidth = e.nativeEvent.layout.width;
      if (containerWidth > 0) {
        const s = containerWidth / width;
        setScale(s);
      }
    }, [width]);

    const translateX = -(width * (1 - scale)) / 2;
    const translateY = -(height * (1 - scale)) / 2;

    return (
      <View
        onLayout={onLayout}
        style={{
          width: "100%",
          height: height * scale,
          overflow: "hidden",
          backgroundColor: "transparent",
        }}
      >
        <ViewShot
          ref={ref}
          options={{ format: "png", quality: 1.0 }}
          style={{
            width: width,
            height: height,
            backgroundColor: "#fff",
            transform: [{ translateX }, { translateY }, { scale }],
          }}
        >
          {children}
        </ViewShot>
      </View>
    );
  },
);
