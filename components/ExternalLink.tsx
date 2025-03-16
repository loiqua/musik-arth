import { openBrowserAsync } from 'expo-web-browser';
import { ReactNode } from 'react';
import { Platform, Text, TouchableOpacity } from 'react-native';

type Props = {
  href: string;
  children: ReactNode;
  style?: any;
};

export function ExternalLink({ href, children, style }: Props) {
  const handlePress = async () => {
    if (Platform.OS !== 'web') {
      await openBrowserAsync(href);
    } else {
      window.open(href, '_blank');
    }
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <Text style={style}>{children}</Text>
    </TouchableOpacity>
  );
}
