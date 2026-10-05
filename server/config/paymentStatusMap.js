const ORDER_STATE_BY_MP_STATUS = {
  approved:     { paymentStatus: 'paid',     status: 'paid',      orderStatus: 'processing' },
  pending:      { paymentStatus: 'pending',  status: 'pending',   orderStatus: 'created' },
  in_process:   { paymentStatus: 'pending',  status: 'pending',   orderStatus: 'created' },
  authorized:   { paymentStatus: 'pending',  status: 'pending',   orderStatus: 'created' },
  in_mediation: { paymentStatus: 'pending',  status: 'pending',   orderStatus: 'created' },
  rejected:     { paymentStatus: 'failed',   status: 'pending',   orderStatus: 'created' }, // sigue pendiente para poder reintentar
  cancelled:    { paymentStatus: 'failed',   status: 'pending',   orderStatus: 'created' },
  refunded:     { paymentStatus: 'refunded', status: 'cancelled', orderStatus: 'refunded' },
  charged_back: { paymentStatus: 'refunded', status: 'cancelled', orderStatus: 'refunded' },
};

module.exports = { ORDER_STATE_BY_MP_STATUS };