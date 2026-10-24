import React from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Avatar from '../../../shared/components/Avatar';
import ListItem from '../../../shared/components/ListItem';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import { ageFrom } from '../../../shared/utils/date';

export default function PatientRow({ patient, onPress, trailing, divider = true }) {
  const { colors } = useTheme();
  const age = ageFrom(patient.birthDate);
  const hasAlert = patient.allergies?.length > 0;
  return (
    <ListItem
      leading={<Avatar name={patient.name} size={42} />}
      title={patient.name}
      subtitle={[age !== null && `${age} yaş`, patient.gender, patient.phone].filter(Boolean).join(' · ')}
      trailing={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {hasAlert ? (
            <Feather name="alert-triangle" size={15} color={colors.warning} accessibilityLabel="Alerji kaydı var" />
          ) : null}
          {trailing}
        </View>
      }
      chevron={!!onPress}
      onPress={onPress}
      divider={divider}
      accessibilityLabel={`${patient.name}${hasAlert ? ', alerji kaydı var' : ''}`}
    />
  );
}
