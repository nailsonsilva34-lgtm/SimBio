import React from 'react';
import { Atom, FlaskConical, Microscope, Circle, Layers, Heart, Network, Leaf } from 'lucide-react';
import { SchoolClass } from '../../types';

export const BiologicalLevelIcon = ({ level, size = 16, className = "" }: { level: string, size?: number, className?: string }) => {
    switch (level) {
        case 'ATOM': return <Atom size={size} className={className} />;
        case 'MOLECULE': return <FlaskConical size={size} className={className} />;
        case 'ORGANELLE': return <Microscope size={size} className={className} />;
        case 'CELL': return <Circle size={size} className={className} />;
        case 'TISSUE': return <Layers size={size} className={className} />;
        case 'ORGAN': return <Heart size={size} className={className} />;
        case 'SYSTEM': return <Network size={size} className={className} />;
        case 'ORGANISM': return <Leaf size={size} className={className} />;
        default: return <Microscope size={size} className={className} />;
    }
};

export const getClassColor = (schoolClass: SchoolClass) => {
    const series = schoolClass.charAt(0);
    if (series === '1') return 'bg-blue-500';
    if (series === '2') return 'bg-purple-500';
    if (series === '3') return 'bg-orange-500';
    return 'bg-slate-200';
};

export const getRankColor = (rank: number) => {
    if (rank === 0) return 'text-yellow-500'; // Gold
    if (rank === 1) return 'text-slate-400'; // Silver
    if (rank === 2) return 'text-amber-700'; // Bronze
    return 'text-emerald-600'; // Default
};

export const getAvatarStyles = (schoolClass: SchoolClass) => {
    const turma = schoolClass.charAt(1);
    const bgClass = getClassColor(schoolClass);
    
    let shapeClass = 'rounded-full';
    if (turma === 'B') shapeClass = 'rounded-lg'; // Square

    return `${bgClass} ${shapeClass}`;
};

export const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};
