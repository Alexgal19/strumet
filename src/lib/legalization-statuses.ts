
export const legalizationStatuses = [
    { value: 'Brak', label: 'Brak', color: 'bg-transparent', highlight: '' },
    { value: 'Wiza', label: 'Wiza', color: 'bg-blue-500/80', highlight: 'bg-blue-500/10' },
    { value: 'Karta pobytu Polska', label: 'Karta pobytu Polska', color: 'bg-green-500/80', highlight: 'bg-green-500/10' },
    { value: 'Karta pobytu innego kraju', label: 'Karta pobytu innego kraju', color: 'bg-teal-500/80', highlight: 'bg-teal-500/10' },
    { value: 'Otrzymana decyzja', label: 'Otrzymana decyzja', color: 'bg-emerald-500/80', highlight: 'bg-emerald-500/10' },
    { value: 'Wniosek na KP złożony', label: 'Wniosek na KP złożony', color: 'bg-yellow-500/80', highlight: 'bg-yellow-500/10' },
    { value: 'Wniosek na KP w innym urzędzie', label: 'Wniosek na KP w innym urzędzie', color: 'bg-amber-500/80', highlight: 'bg-amber-500/10' },
    { value: 'Złożone odciski', label: 'Złożone odciski', color: 'bg-orange-500/80', highlight: 'bg-orange-500/10' },
    { value: 'Dosłane dokumenty do urzędu', label: 'Dosłane dokumenty do urzędu', color: 'bg-sky-500/80', highlight: 'bg-sky-500/10' },
];

export const getStatusColor = (statusValue: string, forBackground = false): string => {
    const status = legalizationStatuses.find(s => s.value === statusValue);
    if (!status) return forBackground ? '' : 'bg-gray-500';
    return forBackground ? status.highlight : status.color;
};
