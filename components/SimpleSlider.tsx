import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

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
  
  // Calculate the position of the thumb
  const thumbPosition = (localValue - minimumValue) / (maximumValue - minimumValue) * width;
  
  // Handle touch events
  const handlePress = (event: any) => {
    const { locationX } = event.nativeEvent;
    const newValue = (locationX / width) * (maximumValue - minimumValue) + minimumValue;
    const clampedValue = Math.max(minimumValue, Math.min(maximumValue, newValue));
    
    if (onSlidingStart) {
      onSlidingStart();
    }
    
    setLocalValue(clampedValue);
    setSliding(true);
    
    if (onSlidingComplete) {
      onSlidingComplete(clampedValue);
    }
    
    setSliding(false);
  };
  
  return (
    <View
      style={[styles.container, style]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
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
            width: thumbPosition,
          }
        ]}
      />
      
      {/* Thumb */}
      <TouchableOpacity
        style={[
          styles.thumb,
          {
            backgroundColor: thumbTintColor,
            transform: [{ translateX: thumbPosition - 10 }],
          }
        ]}
        onPress={() => {}}
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

export default SimpleSlider; 