import { _gum_style } from './style/style.ts';
import { _gum_confirm } from './confirm/confirm.ts';
import { _gum_input } from './input/input.ts';
import { _gum_chooseMultiple, _gum_chooseOne } from './choose/choose.ts';

export class Gum {
	public static chooseOne = _gum_chooseOne;
	public static chooseMultiple = _gum_chooseMultiple;

	public static input = _gum_input;
	public static confirm = _gum_confirm;

	public static style = _gum_style;
}
