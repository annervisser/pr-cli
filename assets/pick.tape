Output ./pick.gif

Require gum
Require pr-cli

Set Shell "bash"
Set FontSize 28
Set Width 1400
Set Height 580
Set Theme "Violet Dark"
Set Margin 2
Set MarginFill "#ffffff"
Set BorderRadius 16

Hide
Type cd "$DIR" Enter
Type clear Enter

Type@0 'clear && gum style --border-foreground="#f0f" --foreground="#f0f" --border="rounded" --align="center" --width="71" "pr-cli pick command"' Enter
Show

Type "Useful for quick changes or bugfixes"
Sleep 500ms
Backspace@15ms 36

Type "Uncommitted or unpushed changed are no problem!"
Sleep 500ms
Backspace@15ms 47

Type@100ms "pr-cli p"
Sleep 100ms
Enter
Hide
Sleep 2s
Show
Sleep 1s
Space
Sleep 1s
Enter
Sleep 1.5s
Enter
Sleep 2s
Enter
Sleep 7s
