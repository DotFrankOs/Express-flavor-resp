const ROLE_LABELS = {
  'admin': 'Administrador',
  'owner': 'Dueño',
  'manager': 'Gerente',
  'staff': 'Personal',
  'customer': 'Cliente',
  'guest': 'Invitado'
};

const STATUS_LABELS = {
  'pending': 'Pendiente',
  'processing': 'En preparación',
  'delivering': 'En camino',
  'delivered': 'Entregado',
  'issue': 'Inconveniente'
};

export function getRoleLabel(role) {
  return ROLE_LABELS[role?.toLowerCase()] || role || 'Invitado';
}

export function getStatusLabel(status) {
  return STATUS_LABELS[status?.toLowerCase()] || status || 'Desconocido';
}