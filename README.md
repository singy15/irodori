
# irodori

irodori, the light weight notepad application.

## How to use?

### Launch application

Just open irodori.exe.

### Changing input mode

Select input mode with combobox.

### How to save my editing?

No need of saving, your progress is autonomously saved
to a file located "~/.irodori/irodori-data.txt".

### JavaScript execution

irodori supports JavaScript execution.

1. Select text you want to evaluate.
2. Press Ctrl + J to evaluate, 
   press Ctrl + Shift + J to evaluate and write result.

### Show and hide, exit

Press Ctrl + Up to toggle show and hide window.

Press Alt + F4 to exit.

## Issues and TODOs

* TODO : Support file mode selection.
* TODO : Support tab edit.
* TODO : Support manual file save and open.
* TODO : Support data backup.
* Issue : Editor section overwrapped by footer.

## For Developer 

### Archiving and packaging with electron-packager
```
electron-packager . irodori --platform=win32 --arch=x64 --electronVersion=2.0.0 --icon=./img/irodori-icon.ico --asar
electron-packager . irodori --platform=win32 --arch=ia32 --electronVersion=2.0.0 --icon=./img/irodori-icon.ico --asar
```

