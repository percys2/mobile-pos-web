'use client';

const statusColors = {
  pagada: 'bg-emerald-500',
  parcial: 'bg-yellow-500',
  pendiente: 'bg-red-500',
  PAGADA: 'bg-emerald-500',
  PARCIAL: 'bg-yellow-500',
  PENDIENTE: 'bg-red-500',
};

const statusLabels = {
  pagada: 'Pagada',
  parcial: 'Parcial',
  pendiente: 'Pendiente',
  PAGADA: 'Pagada',
  PARCIAL: 'Parcial',
  PENDIENTE: 'Pendiente',
};

export default function StatusBadge({ status }) {
  const colorClass = statusColors[status] || 'bg-gray-500';
  const label = statusLabels[status] || status;
  
  return (
    <span
      className={`${colorClass} text-white text-xs px-2 py-1 rounded-full font-medium`}
    >
      {label}
    </span>
  );
}
