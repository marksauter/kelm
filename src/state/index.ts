import { EventStream } from '../core'

export class Kelm<
  UPDATE extends Update<MODEL, MODELPARAM, MSG>,
  MODEL = UPDATE['_Model'],
  MODELPARAM = UPDATE['_ModelParam'],
  MSG = UPDATE['_Msg']
> {
  private _stream: EventStream<UPDATE['_Msg']>

  constructor(stream: EventStream<UPDATE['_Msg']>) {
    this._stream = stream
  }

  stream(): EventStream<UPDATE['_Msg']> {
    return this._stream
  }
}

export interface Update<MODEL = any, MODELPARAM = any, MSG = any> {
  _Model: MODEL
  _ModelParam: MODELPARAM
  _Msg: MSG

  // Create the initial model.
  model(
    kelm: Kelm<Update<this['_Model'], this['_ModelParam'], this['_Msg']>>,
    param?: this['_ModelParam']
  ): this['_Model']

  // Connect the subscriptions.
  // Subscriptions are streams that are spawned wen the object is created.
  subscriptions?(kelm: Kelm<Update<this['_Model'], this['_ModelParam'], this['_Msg']>>): void

  // Method called when a msg is received from an event.
  update(
    kelm: Kelm<Update<this['_Model'], this['_ModelParam'], this['_Msg']>>,
    msg: this['_Msg']
  ): void
}

export interface UpdateNew<MODEL = any, MODELPARAM = any, MSG = any>
  extends Update<MODEL, MODELPARAM, MSG> {
  // Create a new component.
  init(
    kelm: Kelm<Update<this['_Model'], this['_ModelParam'], this['_Msg']>>,
    model: this['_Model']
  ): void
}

export function execute<UPDATE extends UpdateNew>(
  UpdateClass: new () => UPDATE,
  model_param: UPDATE['_ModelParam']
): EventStream<UPDATE['_Msg']> {
  let update = new UpdateClass()
  let stream: EventStream<UPDATE['_Msg']> = new EventStream()

  let kelm = new Kelm<Update<UPDATE['_Model'], UPDATE['_ModelParam'], UPDATE['_Msg']>>(stream)
  let model = update.model(kelm, model_param)
  update.init(kelm, model)

  init_component(stream, update, kelm)
  return stream
}

export function init_component<COMPONENT extends Update>(
  stream: EventStream<COMPONENT['_Msg']>,
  component: COMPONENT,
  kelm: Kelm<Update<COMPONENT['_Model'], COMPONENT['_ModelParam'], COMPONENT['_Msg']>>
) {
  if (typeof component.subscriptions === 'function') {
    component.subscriptions(kelm)
  }
  stream.set_callback(event => update_component(component, kelm, event))
}

export function update_component<COMPONENT extends Update>(
  component: COMPONENT,
  kelm: Kelm<Update<COMPONENT['_Model'], COMPONENT['_ModelParam'], COMPONENT['_Msg']>>,
  event: COMPONENT['_Msg']
) {
  component.update(kelm, event)
}
