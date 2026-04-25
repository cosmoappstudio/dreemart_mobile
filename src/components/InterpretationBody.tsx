import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import { AppText } from './app-text';
import { colors } from '../constants/theme';
import { formatInterpretationParagraphs } from '../helpers/formatInterpretation';

type Props = {
  text: string;
  /** Ana paragraf tipografisi */
  paragraphStyle?: StyleProp<TextStyle>;
  /** Paragraflar arası ek boşluk (varsayılan 14) */
  gap?: number;
};

export function InterpretationBody({
  text,
  paragraphStyle,
  gap = 14,
}: Props) {
  const paragraphs = formatInterpretationParagraphs(text);
  if (paragraphs.length === 0) return null;

  return (
    <View>
      {paragraphs.map((p, i) => (
        <Fragment key={i}>
          {i > 0 ? <View style={{ height: gap }} /> : null}
          <AppText style={[styles.base, paragraphStyle]}>{p}</AppText>
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 26,
    letterSpacing: 0.15,
  },
});
