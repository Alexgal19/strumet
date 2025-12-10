
export const legalizationStatuses = [
    { value: 'Brak', label: 'Brak', color: 'bg-transparent', highlight: '' },
    { value: 'Wiza', label: 'Wiza', color: 'bg-sky-500/80', highlight: 'bg-sky-500/10' },
    { value: 'Karta pobytu Polska', label: 'Karta pobytu Polska', color: 'bg-emerald-500/80', highlight: 'bg-emerald-500/10' },
    { value: 'Karta pobytu innego kraju', label: 'Karta pobytu innego kraju', color: 'bg-teal-500/80', highlight: 'bg-teal-500/10' },
    { value: 'Otrzymana decyzja', label: 'Otrzymana decyzja', color: 'bg-green-500/80', highlight: 'bg-green-500/10' },
    { value: 'Wniosek na KP złożony', label: 'Wniosek na KP złożony', color: 'bg-amber-500/80', highlight: 'bg-amber-500/10' },
    { value: 'Wniosek na KP w innym urzędzie', label: 'Wniosek na KP w innym urzędzie', color: 'bg-yellow-600/80', highlight: 'bg-yellow-600/10' },
    { value: 'Złożone odciski', label: 'Złożone odciski', color: 'bg-orange-500/80', highlight: 'bg-orange-500/10' },
    { value: 'Dosłane dokumenty do urzędu', label: 'Dosłane dokumenty do urzędu', color: 'bg-cyan-500/80', highlight: 'bg-cyan-500/10' },
];

export const getStatusColor = (statusValue: string, forBackground = false): string => {
    const status = legalizationStatuses.find(s => s.value === statusValue);
    if (!status) return forBackground ? '' : 'bg-muted';
    return forBackground ? status.highlight : status.color;
};
