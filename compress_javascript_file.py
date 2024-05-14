import re
import traceback

# Usage: python compress_javascript_file.py

# Compress a javascript file while keeping its behaviour
def compress_javascript_file(source_file_path, target_file_path):
    try:

        print(f"\nCompressing {source_file_path} into {target_file_path}...")

        # Read uncompressed file
        with open(source_file_path, 'r') as file:
            content = file.read()

        content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL) # remove multi-line comments
        # negative lookbehind (?<!:) checks that the characters ":" do not appear immediately before the current position
        content = re.sub(r'(?<!:)(//.*?\n)', '\n', content, flags=re.DOTALL) # remove mono-line comments, excluding http://, https://, ftp://...

        content = re.sub(r'[ \t]+=', '=', content, flags=re.DOTALL) # =, ==
        content = re.sub(r'=[ \t]+', '=', content, flags=re.DOTALL) # =, ==
        content = re.sub(r'[ \t]+!', '!', content, flags=re.DOTALL) # !
        content = re.sub(r'[ \t]*\|\|[ \t]*', '||', content, flags=re.DOTALL) # ||
        content = re.sub(r'[ \t]*&&[ \t]*', '&&', content, flags=re.DOTALL) # &&
        content = re.sub(r'if[ \t]*\([ \t]*', 'if(', content, flags=re.DOTALL) # if (
        content = re.sub(r'[ \t]*;[ \t]*', ';', content, flags=re.DOTALL) # ;
        content = re.sub(r'[ \t]*\+[ \t]*', '+', content, flags=re.DOTALL) # +
        content = re.sub(r'[ \t]*-[ \t]*', '-', content, flags=re.DOTALL) # -
        content = re.sub(r'[ \t]*{[ \t]*', '{', content, flags=re.DOTALL) # {
        content = re.sub(r'[ \t]*}[ \t]*', '}', content, flags=re.DOTALL) # }

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

compress_javascript_file("SuperMasterMind_uncompressed.js", "SuperMasterMind.js")
compress_javascript_file("GameSolver_uncompressed.js", "GameSolver.js")
