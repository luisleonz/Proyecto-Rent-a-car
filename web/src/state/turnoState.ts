const fmt = (n: number) => new Intl.NumberFormat('en-US').format(n)

export const turnoState = {
  isOpen: false,
  turnoId: 'T1',
  horario: '09:00 — 15:00',
  fondoInicial: 3000,
  efectivoRecibido: 8200,
  speiRecibido: 6050,
  movimientos: 11,
  entregas: 4,
  retornos: 2,
  get totalRecibido() { return this.efectivoRecibido + this.speiRecibido },
  billetes500: 0,
  billetes200: 0,
  billetes100: 0,
  billetes50: 0,
  billetes20: 0,
  get totalContado() {
    return this.billetes500 * 500 + this.billetes200 * 200 +
      this.billetes100 * 100 + this.billetes50 * 50 + this.billetes20 * 20
  },
  get esperadoEnCaja() { return this.efectivoRecibido },
  get diferencia() { return this.totalContado - this.fondoInicial - this.esperadoEnCaja },
  justificacionCausa: '',
  justificacionNota: '',
  resetConteo() {
    this.billetes500 = 22; this.billetes200 = 1
    this.billetes100 = 0; this.billetes50 = 0; this.billetes20 = 0
  },
  openTurno() {
    this.isOpen = true; this.fondoInicial = 3000
    this.billetes500 = 0; this.billetes200 = 0; this.billetes100 = 0
    this.billetes50 = 0; this.billetes20 = 0
    this.justificacionCausa = ''; this.justificacionNota = ''
  },
}

export { fmt }
