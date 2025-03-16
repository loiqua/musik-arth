import React, { useState, useEffect, useCallback, memo } from 'react';
import { StyleSheet, TouchableOpacity, View, LayoutChangeEvent, GestureResponderEvent } from 'react-native';

interface SimpleSliderProps {
  value: number;
  minimumValue?: number;
  maximumValue?: number;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  style?: any;
  onSlidingStart?: () => void;
  onSlidingComplete?: (value: number) => void;
}

const SimpleSlider: React.FC<SimpleSliderProps> = ({
  value = 0,
  minimumValue = 0,
  maximumValue = 1,
  minimumTrackTintColor = '#007AFF',
  maximumTrackTintColor = '#CCCCCC',
  thumbTintColor = '#007AFF',
  style,
  onSlidingStart,
  onSlidingComplete,
}) => {
  const [width, setWidth] = useState(0);
  const [sliding, setSliding] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  
  // Mettre à jour localValue lorsque la prop value change, mais seulement si l'utilisateur n'est pas en train de faire glisser
  useEffect(() => {
    if (!sliding) {
      setLocalValue(value);
    }
  }, [value, sliding]);
  
  // Calculate the position of the thumb
  const thumbPosition = sliding 
    ? (localValue - minimumValue) / (maximumValue - minimumValue) * width
    : (value - minimumValue) / (maximumValue - minimumValue) * width;
  
  // Optimiser la fonction handleLayout pour éviter les recréations à chaque rendu
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);
  
  // Handle touch events - optimisé avec useCallback
  const handlePress = useCallback((event: GestureResponderEvent) => {
    const { locationX } = event.nativeEvent;
    const newValue = (locationX / width) * (maximumValue - minimumValue) + minimumValue;
    const clampedValue = Math.max(minimumValue, Math.min(maximumValue, newValue));
    
    if (onSlidingStart) {
      onSlidingStart();
    }
    
    setSliding(true);
    setLocalValue(clampedValue);
    
    // Utiliser requestAnimationFrame pour améliorer les performances
    requestAnimationFrame(() => {
      if (onSlidingComplete) {
        onSlidingComplete(clampedValue);
      }
      setSliding(false);
    });
  }, [width, minimumValue, maximumValue, onSlidingStart, onSlidingComplete]);
  
  return (
    <View
      style={[styles.container, style]}
      onLayout={handleLayout}
    >
      {/* Background track */}
      <View
        style={[
          styles.track,
          { backgroundColor: maximumTrackTintColor }
        ]}
      />
      
      {/* Filled track */}
      <View
        style={[
          styles.filledTrack,
          {
            backgroundColor: minimumTrackTintColor,
            width: Math.max(0, thumbPosition),
          }
        ]}
      />
      
      {/* Thumb */}
      <View
        style={[
          styles.thumb,
          {
            backgroundColor: thumbTintColor,
            transform: [{ translateX: Math.max(0, thumbPosition - 10) }],
          }
        ]}
      />
      
      {/* Touch area */}
      <TouchableOpacity
        style={styles.touchArea}
        onPress={handlePress}
        activeOpacity={1}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    borderRadius: 2,
  },
  filledTrack: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    left: 0,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    top: 10,
  },
  touchArea: {
    ...StyleSheet.absoluteFillObject,
  },
});

// Utiliser memo pour éviter les rendus inutiles
export default memo(SimpleSlider); 