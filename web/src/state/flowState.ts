export const entregaState = {
  reservationId: '',
  docLic: false, docIne: false, docDom: false, docTarj: false,
  signed: false, damageCount: 0, photoCount: 0,
  fuelLevel: '3/4', kmStart: '0',
  paymentMethod: 'cash', amountReceived: '',
  get allDocsOk() { return this.docLic && this.docIne && this.docDom && this.docTarj },
  reset(resId: string) {
    this.reservationId = resId
    this.docLic = false; this.docIne = false; this.docDom = false; this.docTarj = false
    this.signed = false; this.damageCount = 0; this.photoCount = 0
    this.fuelLevel = '3/4'; this.kmStart = '0'
    this.paymentMethod = 'cash'; this.amountReceived = ''
  },
}

export const devolucionState = {
  reservationId: '',
  kmReturn: '0', fuelLevel: '1/2', newDamageCount: 0,
  returnMethod: 'cash', photoTaken: false, signed: false,
  get kmExtra() {
    const km = parseInt(this.kmReturn) || 0
    const recorrido = km - 45200
    return Math.max(0, recorrido - 600)
  },
  get fuelDeficit() {
    const map: Record<string, number> = { E: 4, '1/4': 3, '1/2': 2, '3/4': 0, F: 0 }
    return map[this.fuelLevel] ?? 0
  },
  get extraCharges() { return this.kmExtra * 3 + this.fuelDeficit * 80 + this.newDamageCount * 800 },
  get depositAmount() { return 2000 },
  get toReturn() { return Math.max(0, this.depositAmount - this.extraCharges) },
  get toCharge() { return Math.max(0, this.extraCharges - this.depositAmount) },
  reset(resId: string) {
    this.reservationId = resId
    this.kmReturn = '0'; this.fuelLevel = '1/2'; this.newDamageCount = 0
    this.returnMethod = 'cash'; this.photoTaken = false; this.signed = false
  },
}
