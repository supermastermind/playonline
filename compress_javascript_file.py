import re
import traceback
import os
import subprocess

# Usage: python compress_javascript_file.py

# Compress a javascript file while keeping its behaviour
def compress_javascript_file(source_file_path, target_file_path, all_optims):
    try:

        print(f"\nCompressing {source_file_path} into {target_file_path}...")

        # Read uncompressed file
        with open(source_file_path, 'r', encoding='utf-8') as file:
            content = file.read()

        content = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL) # remove multi-line HTML comments
        content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL) # remove multi-line javascript comments
        # negative lookbehind (?<!:) checks that the characters ":" do not appear immediately before the current position
        content = re.sub(r'(?<!:)(//.*?\n)', '\n', content, flags=re.DOTALL) # remove mono-line javascript comments, excluding http://, https://, ftp://...

        content = re.sub(r'[ \t]+=', '=', content, flags=re.DOTALL) # =, ==
        content = re.sub(r'=[ \t]+', '=', content, flags=re.DOTALL) # =, ==
        content = re.sub(r'[ \t]*;[ \t]*', ';', content, flags=re.DOTALL) # ;
        content = re.sub(r'[ \t]*{[ \t]*', '{', content, flags=re.DOTALL) # {
        content = re.sub(r'[ \t]*}[ \t]*', '}', content, flags=re.DOTALL) # }
        content = re.sub(r'if[ \t]*\([ \t]*', 'if(', content, flags=re.DOTALL) # if (
        content = re.sub(r'[ \t]*\|\|[ \t]*', '||', content, flags=re.DOTALL) # ||
        content = re.sub(r'[ \t]*&&[ \t]*', '&&', content, flags=re.DOTALL) # &&

        if all_optims:
            content = re.sub(r'[ \t]+!', '!', content, flags=re.DOTALL) # !
            content = re.sub(r'[ \t]*\+[ \t]*', '+', content, flags=re.DOTALL) # +
            content = re.sub(r'[ \t]*-[ \t]*', '-', content, flags=re.DOTALL) # -

        content = re.sub(r'^[ \t\n]*', '', content, flags=re.DOTALL) # leading spaces 1
        content = re.sub(r'\n[ \t]+', '\n', content, flags=re.DOTALL) # leading spaces 2
        content = re.sub(r'[ \t]+\n', '\n', content, flags=re.DOTALL) # trailing spaces 1
        content = re.sub(r'[ \t\n]*$', '', content, flags=re.DOTALL) # trailing spaces 2
        content = re.sub(r'\n+', '\n', content, flags=re.DOTALL) # empty lines

        content = re.sub(r'}\n}', '}}', content, flags=re.DOTALL) # }...}
        content = re.sub(r'}\n}', '}}', content, flags=re.DOTALL) # }...}

        # Write compressed file
        with open(target_file_path, 'wb') as file: # wb will remove ending \r characters if any
            file.write(content.encode('utf-8'))

        print("SUCCESS")

    except Exception as e:
        print("ERROR")
        print(traceback.format_exc())

compress_javascript_file("SuperMasterMind_uncompressed.js", "SuperMasterMind.js", True)
compress_javascript_file("GameSolver_uncompressed.js", "GameSolver.js", True)
compress_javascript_file("game_uncompressed.html", "game.html", False)

# Compress SuperMasterMind.js
if os.path.isfile("SuperMasterMind.js.gz"):
    os.remove("SuperMasterMind.js.gz")
# "C:\Program Files\7-Zip\7z.exe" a -tgzip SuperMasterMind.js.gz SuperMasterMind.js
cmd = [r"C:\Program Files\7-Zip\7z.exe", "a", "SuperMasterMind.js.gz", "SuperMasterMind.js", "-tgzip"]
subprocess.Popen(cmd, stderr=subprocess.STDOUT, stdout=subprocess.PIPE).communicate()