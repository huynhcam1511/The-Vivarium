shader_type canvas_item;

// Uniforms
uniform sampler2D soil_texture : repeat_enable, filter_linear_mipmap;
uniform sampler2D occupancy_mask : filter_linear;
uniform vec2 soil_texture_scale = vec2(640.0, 480.0);
uniform vec2 soil_origin = vec2(0.0, 0.0);
uniform bool mirror_horizontal = false;
uniform vec4 rim_color : source_color = vec4(0.14, 0.08, 0.05, 1.0);
uniform vec4 cavity_ambient : source_color = vec4(0.24, 0.10, 0.07, 1.0);
uniform vec4 cavity_inner_glow : source_color = vec4(0.48, 0.18, 0.10, 1.0);

uniform float edge_threshold_low : hint_range(0.1, 0.8) = 0.38;
uniform float edge_threshold_high : hint_range(0.2, 0.9) = 0.52;
uniform float rim_width : hint_range(0.01, 0.25) = 0.08;

varying vec2 world_position;

void vertex() {
	world_position = (MODEL_MATRIX * vec4(VERTEX, 0.0, 1.0)).xy;
}

void fragment() {
	// Sample continuous soil texture mapped to world-space coordinates
	vec2 soil_uv = (world_position - soil_origin) / soil_texture_scale;
	if (mirror_horizontal) {
		soil_uv.x = 1.0 - abs(mod(soil_uv.x, 2.0) - 1.0);
		soil_uv.y = clamp(soil_uv.y, 0.0, 1.0);
	}
	vec4 soil_col = texture(soil_texture, soil_uv);

	// Sample the occupancy mask (0.0 = excavated cavity, 1.0 = solid soil)
	float mask_val = texture(occupancy_mask, UV).r;

	// Calculate smooth organic contour
	float solid_factor = smoothstep(edge_threshold_low, edge_threshold_high, mask_val);

	// Earthen rim shadow right at the excavated boundary
	float rim_factor = smoothstep(edge_threshold_low - rim_width, edge_threshold_low, mask_val) *
	                   (1.0 - smoothstep(edge_threshold_low, edge_threshold_high, mask_val));

	// Interior cavity with warm red observation light & subtle background depth texture
	vec4 inner_soil = soil_col * 0.35; // Faint subterranean backdrop depth
	vec4 cavity_glow = mix(cavity_ambient, cavity_inner_glow, 1.0 - (mask_val / max(0.001, edge_threshold_low)));
	vec4 cavern_interior = mix(cavity_glow, inner_soil, 0.25);

	// Cavern edge with darkened earthen rim
	vec4 solid_wall = mix(rim_color, soil_col, smoothstep(edge_threshold_low, edge_threshold_high + 0.12, mask_val));

	// Final composite: Cavern Interior -> Rim -> Solid Soil
	COLOR = mix(cavern_interior, solid_wall, solid_factor);
}
