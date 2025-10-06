export interface CanvasPageResponse {
  title: string;
  components: CanvasComponent[];
}

export interface CanvasComponent {
  uuid: string;
  component_id: string;
  parent_uuid: string | null;
  slot: string | null;
  inputs: string;
}
