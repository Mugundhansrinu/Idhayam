import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Props {
    label: string;
    value: string; // DD-MM-YYYY
    onSelect: (dateStr: string) => void;
}

const ReportDatePicker: React.FC<Props> = ({ label, value, onSelect }) => {
    const [show, setShow] = useState(false);

    // Convert DD-MM-YYYY string to Date object
    const parseDate = (str: string) => {
        if (!str || str.length < 10) return new Date();
        const [d, m, y] = str.split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    // Format Date object to DD-MM-YYYY string
    const formatDate = (date: Date) => {
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${d}-${m}-${y}`;
    };

    const onChange = (event: any, selectedDate?: Date) => {
        setShow(Platform.OS === 'ios');
        if (selectedDate) {
            onSelect(formatDate(selectedDate));
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity 
                style={styles.picker} 
                onPress={() => setShow(true)}
                activeOpacity={0.7}
            >
                <Text style={[styles.value, !value && { color: '#A0AEC0' }]}>
                    {value || 'DD-MM-YYYY'}
                </Text>
                <Icon name="event" size={20} color="#3861FB" />
            </TouchableOpacity>

            {show && (
                <DateTimePicker
                    value={parseDate(value)}
                    mode="date"
                    display="default"
                    onChange={onChange}
                    maximumDate={new Date()}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    label: { fontSize: 8, fontWeight: '900', color: '#A0AEC0', letterSpacing: 0.5, marginBottom: 4 },
    picker: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#F8F9FD', 
        borderRadius: 12, 
        paddingHorizontal: 8, 
        height: 44, 
        borderWidth: 1, 
        borderColor: '#EDF2F7' 
    },
    value: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
});

export default ReportDatePicker;
