import React from 'react';
import { Pressable, Text, ViewStyle, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

interface HapticTabProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const HapticTab: React.FC<HapticTabProps> = ({ label, onPress, style, textStyle }) => {
  const handlePress = () => {
    Haptics.selectionAsync(); // You can also use impactAsync for stronger feedback
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={style}>
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  );
};

export default HapticTab;
