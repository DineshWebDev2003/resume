import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { Theme, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, intensity = 20 }) => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <BlurView 
      intensity={intensity} 
      style={[
        styles.card, 
        { 
          backgroundColor: colors.glass,
          borderColor: colors.glassBorder
        }, 
        style
      ]}
      tint={colorScheme === 'dark' ? 'dark' : 'light'}
    >
      {children}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
