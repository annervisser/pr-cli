import { _gum_style, _gum_style_to_string } from './style/style.ts';
import { _gum_confirm } from './confirm/confirm.ts';
import { _gum_input } from './input/input.ts';
import { _gum_chooseMultiple, _gum_chooseOne } from './choose/choose.ts';
import { _gum_join, _gum_join_to_string } from './join/join.ts';
import { _gum_write } from './write/write.ts';

export class Gum {
	public static chooseOne = _gum_chooseOne;
	public static chooseMultiple = _gum_chooseMultiple;

	public static input = _gum_input;
	public static confirm = _gum_confirm;

	public static style = _gum_style;
	public static styleToString = _gum_style_to_string;

	public static join = _gum_join;
	public static joinToString = _gum_join_to_string;

	public static write = _gum_write;
}
