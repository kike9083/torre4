Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "G:\Documents\app\bratpit\torre4"
WshShell.Run "npm run dev", 0, False
Set WshShell = Nothing
