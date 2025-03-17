import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  LayoutChangeEvent,
  GestureResponderEvent,
  Animated,
  PanResponder,
} from 'react-native';

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

const SimpleSlider: React.FC<SimpleSliderProps> = memo(({
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
  const [containerWidth, setContainerWidth] = useState(0);
  const [sliding, setSliding] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);
  
  // Utiliser des valeurs animées pour une performance optimale
  const translateX = useRef(new Animated.Value(0)).current;
  const lastValue = useRef(value);
  
  // Helper pour convertir une valeur en position
  const valueToPosition = useCallback(
    (val: number) => containerWidth * (val - minimumValue) / (maximumValue - minimumValue),
    [containerWidth, minimumValue, maximumValue]
  );
  
  // Helper pour convertir une position en valeur
  const positionToValue = useCallback(
    (position: number) => {
      const val = (position / containerWidth) * (maximumValue - minimumValue) + minimumValue;
      return Math.max(minimumValue, Math.min(maximumValue, val));
    },
    [containerWidth, minimumValue, maximumValue]
  );
  
  // Mettre à jour la position du curseur lorsque value change
  useEffect(() => {
    if (!sliding && value !== lastValue.current) {
      const newPosition = valueToPosition(value);
      translateX.setValue(newPosition);
      setProgressWidth(newPosition);
      lastValue.current = value;
    }
  }, [value, sliding, valueToPosition, translateX]);
  
  // Créer un PanResponder pour gérer les gestes de façon performante
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      
      onPanResponderGrant: () => {
        setSliding(true);
        if (onSlidingStart) {
          onSlidingStart();
        }
      },
      
      onPanResponderMove: (_, gestureState) => {
        let newX = gestureState.dx + valueToPosition(lastValue.current);
        
        // Limiter aux bornes
        newX = Math.max(0, Math.min(containerWidth, newX));
        
        // Mettre à jour la position animée
        translateX.setValue(newX);
        
        // Mettre à jour la largeur de la barre de progression
        setProgressWidth(newX);
      },
      
      onPanResponderRelease: () => {
        // Créer une variable pour stocker la position actuelle
        let position = 0;
        
        // Obtenir la valeur actuelle de l'animation via un listener une seule fois
        const id = translateX.addListener(state => {
          position = state.value;
        });
        
        // Supprimer le listener immédiatement après
        translateX.removeListener(id);
        
        // Calculer la nouvelle valeur
        const newValue = positionToValue(position);
        
        // Stocker la dernière valeur
        lastValue.current = newValue;
        
        // Notifier du changement
        if (onSlidingComplete) {
          onSlidingComplete(newValue);
        }
        
        setSliding(false);
      },
      
      onPanResponderTerminate: () => {
        setSliding(false);
      },
    })
  ).current;
  
  // Optimiser la fonction handleLayout pour éviter les recréations à chaque rendu
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
    
    // Initialiser la position du curseur
    if (width > 0) {
      const initialPosition = width * (value - minimumValue) / (maximumValue - minimumValue);
      translateX.setValue(initialPosition);
      setProgressWidth(initialPosition);
    }
  }, [minimumValue, maximumValue, value, translateX]);
  
  // Gestionnaire pour les clics directs sur la barre
  const handlePress = useCallback((event: GestureResponderEvent) => {
    if (containerWidth <= 0) return;
    
    const { locationX } = event.nativeEvent;
    
    if (onSlidingStart) {
      onSlidingStart();
    }
    
    // Limiter aux bornes
    const clampedLocationX = Math.max(0, Math.min(containerWidth, locationX));
    
    // Calculer la nouvelle valeur
    const newValue = positionToValue(clampedLocationX);
    
    // Mettre à jour la largeur de la barre de progression
    setProgressWidth(clampedLocationX);
    
    // Animer jusqu'à la nouvelle position
    Animated.timing(translateX, {
      toValue: clampedLocationX,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      // Mettre à jour la dernière valeur
      lastValue.current = newValue;
      
      // Notifier du changement
      if (onSlidingComplete) {
        onSlidingComplete(newValue);
      }
    });
  }, [containerWidth, positionToValue, onSlidingStart, onSlidingComplete, translateX]);
  
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
      
      {/* Filled track - non animé */}
      <View
        style={[
          styles.filledTrack,
          {
            backgroundColor: minimumTrackTintColor,
            width: progressWidth,
          }
        ]}
      />
      
      {/* Thumb */}
      <Animated.View
        style={[
          styles.thumb,
          {
            backgroundColor: thumbTintColor,
            transform: [{ translateX: Animated.subtract(translateX, 10) }],
          }
        ]}
        {...panResponder.panHandlers}
      />
      
      {/* Touch area */}
      <TouchableOpacity
        style={styles.touchArea}
        onPress={handlePress}
        activeOpacity={1}
      />
    </View>
  );
});

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
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    zIndex: 10,
  },
  touchArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9,
  },
});

export default SimpleSlider; 