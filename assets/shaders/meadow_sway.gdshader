shader_type canvas_item;

// One meadow strip is still a single sprite. Move its upper edge slightly while
// keeping the grass line planted at the surface.
void vertex() {
	float height_weight = 1.0 - UV.y;
	VERTEX.x += sin(TIME * 1.15 + UV.x * 4.0) * 5.0 * height_weight;
}
