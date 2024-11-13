import os
import json

from .Helpers import getPrintValue, pd4web_print
from .Pd4Web import Pd4Web


class PatchLine:
    def __init__(self):
        self.InitVariables()

    def InitVariables(self):
        self.isExternal = False
        self.isAbstraction = False
        self.isLocalAbstraction = False
        self.objwithSlash = False  # for objects like /~ / and //
        self.completLine = ""
        self.name = ""
        self.completName = ""
        self.library = "pure-data"
        self.index = 0
        self.objGenSym = ""
        self.setupFunction = ""
        self.singleObject = False
        self.genSymIndex = 0
        self.functionName = ""
        self.objFound = False
        self.uiReceiver = False
        self.uiSymbol = ""
        self.absPath = ""
        self.localAbs = False
        self.Tokens = []
        self.SpecialObjects = ["adc~", "dac~"]

    # ──────────────────────────────────────
    def __str__(self) -> str:
        if self.isExternal:
            return "< External Obj: " + self.name + " | Lib: " + self.library + " >"
        else:
            if self.Tokens[0] == "#X":
                if self.Tokens[1] == "obj":
                    objName = self.Tokens[4].replace("\n", "").replace(";", "")
                    if objName in self.SpecialObjects:
                        return "< Pd Special Object: " + objName + " >"
                    else:
                        return "< Pd Object: " + self.Tokens[1] + " | " + objName + " >"
                elif self.Tokens[1] == "connect":
                    return "< Pd Connection >"
                elif self.Tokens[1] == "text":
                    return "< Pd Text >"
                elif self.Tokens[1] == "msg":
                    return "< Pd Message >"
                elif self.Tokens[1] == "floatatom":
                    return "< Pd Float >"
                elif self.Tokens[1] == "restore":
                    return "< Pd Restore >"
                else:
                    return "< Pd Object: " + str(self.Tokens) + " >"

            elif self.Tokens[0] == "#A":
                return "< Array Data >"

            else:
                return "< Special Pd Object: " + self.Tokens[0] + " >"

    def __repr__(self):
        return self.__str__()


# ╭──────────────────────────────────────╮
# │    This function will process the    │
# │    patch and get all informations    │
# │           about externals            │
# ╰──────────────────────────────────────╯
class Patch:
    def __init__(self, Pd4Web: Pd4Web, isabs=False, patch=None):
        self.Pd4Web = Pd4Web
        self.isAbstraction = isabs        
        if isabs:
            patchfile = os.path.basename(patch)
            if patch in self.Pd4Web.processedAbs:
                pd4web_print(
                    f"Abstraction {patchfile} already processed", 
                    color="blue", 
                    silence=self.Pd4Web.SILENCE, 
                    pd4web=self.Pd4Web.PD_EXTERNAL
                )
                #return
            
            pd4web_print(
                f"Processing Abstraction {patchfile}", color="blue", silence=self.Pd4Web.SILENCE, pd4web=self.Pd4Web.PD_EXTERNAL
            )
        else:
            libFolder = os.path.join(self.Pd4Web.PROJECT_ROOT, "Pd4Web/pure-data/src")
            self.Pd4Web.Objects.GetLibraryObjects(libFolder, "pure-data")
            
        if patch is not None:
            self.patchFile = patch
        else:
            if os.path.exists(Pd4Web.Patch):
                self.patchFile = Pd4Web.Patch
            else:
                raise ValueError("Patch not found")

        # Read Line by Line
        with open(self.patchFile, "r") as file:
            self.patchLines = file.readlines()

        # Init Supported Libraries
        self.initVariables()

        # Main Functions
        self.execute()

        # Rewrite the patches to remove preffix
        self.reConfigurePatch()

        # if not abs:
        if isabs and patch != "" and patch not in self.Pd4Web.processedAbs:
            self.Pd4Web.processedAbs.append(patch)
            print(f"Processed Abs: {self.Pd4Web.processedAbs}")

    def initVariables(self):
        self.PROJECT_ROOT = self.Pd4Web.PROJECT_ROOT
        self.libraryClass = None
        self.localAbstractions = []
        self.patchLinesExternals = []
        self.declaredAbs = []
        self.absProcessed = []
        self.patchLinesProcessed = []
        self.uiReceiversSymbol = []
        self.needExtra = False
        self.guiObject = 0

    def execute(self):
        # Abstractions
        self.getAbstractions()

        # Find Externals in Patch
        self.processPatch()

    # ╭──────────────────────────────────────╮
    # │             Abstractions             │
    # ╰──────────────────────────────────────╯
    def getAbstractions(self):
        """
        This function list all pd patch in the same folder of the main patch.
        """
        localAbstractions = []
        files = os.listdir(os.path.dirname(self.PROJECT_ROOT))
        for file in files:
            if file.endswith(".pd"):
                localAbstractions.append(file.split(".pd")[0])
        self.localAbstractions = localAbstractions

    # ╭──────────────────────────────────────╮
    # │        Find Externals Objects        │
    # ╰──────────────────────────────────────╯
    def checkIfIsLibObj(self, line: PatchLine):
        if line.Tokens[0] == "#X" and line.Tokens[1] == "obj" and "/" in line.Tokens[4]:
            return True
        else:
            return False

    def checkIfIsSlashObj(self, line: PatchLine):
        """
        The function search for objects like else/count and others, what split
        the library and the object name. For objects like /, //, /~ and //~ this
        function will return False.
        """
        objName = line.completName
        if objName == "/" or objName == "//" or objName == "/~" or objName == "//~":
            line.objwithSlash = True
            return False
        return True

    def isMidiObj(self, line: PatchLine):
        """
        The function check if the object is a midi object.
        """
        midiIn = [
            "notein",
            "cltin",
            "bendin",
            "pgmin",
            "touchin",
            "polytouchin",
            "midiin",
            "midirealtimein",
            "sysexin",
        ]
        midiOut = [
            "noteout",
            "cltout",
            "bendout",
            "pgmout",
            "touchout",
            "polytouchout",
            "midiout",
        ]
        midiObj = midiIn + midiOut
        if line.name in midiObj:
            return True
        return False

    def isLibAbs(self, line: PatchLine):
        line.library = line.Tokens[4].split("/")[0]
        line.name = line.completName.split("/")[-1]
        if self.Pd4Web.Libraries.isSupportedLibrary(line.library):
            externalsJson = os.path.join(self.PROJECT_ROOT, "Pd4Web/Externals/Objects.json")
            if not os.path.exists(externalsJson):
                raise Exception("Externals Json not found!")
            libAbs = []
            with open(externalsJson, "r") as file:
                externalsDict = json.load(file)
                if line.library in externalsDict:
                    libAbs = externalsDict[line.library]["abs"]
                else:
                    self.Pd4Web.Objects.GetSupportedObjects(line.library)
                    
            with open(externalsJson, "r") as file:
                externalsDict = json.load(file)
                if line.library in externalsDict:
                    libAbs = externalsDict[line.library]["abs"]
                else:
                    raise Exception(f"Library {line.library} not found in {externalsJson}")
                    
            if line.name in libAbs:
                externalSpace = 25 - len(line.name)
                absName = line.name + (" " * externalSpace)
                pd4web_print(
                    f"Found Abs: {absName}  | Lib: {line.library}",
                    color="green",
                    silence=self.Pd4Web.SILENCE,
                    pd4web=self.Pd4Web.PD_EXTERNAL,
                )
                line.isAbstraction = True
                libPath = os.path.join(self.PROJECT_ROOT, "Pd4Web/Externals", line.library)
                for root, _, files in os.walk(libPath):
                    for file in files:
                        if file == line.name + ".pd":
                            line.absPath = os.path.join(root, file)
                            return True
                return True

        else:
            return False

    def searchForSpecialObject(self, PatchLine: PatchLine):
        """
        There is some special objects that we need extra configs.
        This function will search for these objects and add the configs.
        """
        # There is no special object for now
        ObjName = PatchLine.name
        if "dac~" == ObjName:
            highChCount = 0
            for i in range(5, len(PatchLine.Tokens)):
                try:
                    outChCount = int(PatchLine.Tokens[i])
                    if outChCount > highChCount:
                        highChCount = outChCount
                except:
                    break
            if highChCount > self.Pd4Web.OUTCHS_COUNT:
                self.Pd4Web.OUTCHS_COUNT = highChCount

        if "adc~" == ObjName:
            highChCount = 0
            for i in range(5, len(PatchLine.Tokens)):
                try:
                    outChCount = int(PatchLine.Tokens[i])
                    if outChCount > highChCount:
                        highChCount = outChCount
                except:
                    break
            if highChCount > self.Pd4Web.INCHS_COUNT:
                self.Pd4Web.INCHS_COUNT = highChCount

        if self.isMidiObj(PatchLine):
            pd4web_print(
                "Enable MIDI support", color="blue", silence=self.Pd4Web.SILENCE, pd4web=self.Pd4Web.PD_EXTERNAL
            )
            self.Pd4Web.MIDI = True

    def addGuiReceiver(self, line: PatchLine, index: int):
        ''' '''
        self.guiObject += 1
        line.Tokens[index] = f"pd4web_gui_{self.guiObject}"
        line.uiReceiver = True

        pass

    def searchForGuiObject(self, line: PatchLine):
        '''
        '''
        # TODO: Automatic gui objects
        if not self.Pd4Web.GUI:
            return
        if line.Tokens[0] == "#X" and line.Tokens[1] == "obj":
            if line.name == "vu":
                r = line.Tokens[4]
                if r == "empty":
                    self.addGuiReceiver(line, 7)
            if line.name == "vsl":
                r = line.Tokens[11]
                if r == "empty":
                    self.addGuiReceiver(line, 11)
                s = line.Tokens[12]
                if s == "empty":
                    self.addGuiReceiver(line, 12)

    def tokenIsFloat(self, token):
        '''All floats are valid as objects'''
        token = token.replace("\n", "").replace(";", "").replace(",", "")
        try:
            return float(token)
        except:
            return float("inf")

    def tokenIsDollarSign(self, token):
        ''' Objects like $0'''
        if token[0] == "$":
            return True
        elif token[0] == "\\" and token[1] == "$":
            return True
        else:
            return False

    def processPatch(self):
        """
        This function will find all externals objects in the patch.
        """
        for line in enumerate(self.patchLines):
            patchLine = PatchLine()
            patchLine.index, patchLine.completLine = line
            tokens = patchLine.completLine.replace("\n", "")
            tokens = tokens.replace(";", "")
            tokens = tokens.replace(",", "")  # when width is specificied
            patchLine.Tokens = tokens.split(" ")

            # no objects
            if len(patchLine.Tokens) < 5 or patchLine.Tokens[1] != "obj":
                # declare libs
                if len(patchLine.Tokens) == 4 and patchLine.Tokens[1] == "declare":
                    if patchLine.Tokens[2] == "-lib":
                        path = patchLine.Tokens[3]
                        if not self.Pd4Web.Libraries.isSupportedLibrary(path):
                            raise Exception(f"Library not supported: {path} in {self.patchFile}")
                        self.Pd4Web.Libraries.GetLibrarySourceCode(path)
                        self.Pd4Web.Objects.GetSupportedObjects(path)
                        self.Pd4Web.declaredLibsObjs.append(path)

                    elif patchLine.Tokens[2] == "-path":
                        path = patchLine.Tokens[3]
                        if self.Pd4Web.Libraries.isSupportedLibrary(path):
                            self.Pd4Web.Libraries.GetLibrarySourceCode(path)
                            self.Pd4Web.declaredPaths.append(path)
                        else:
                            self.declaredLocalPaths.append(path)
                            localPath = os.path.join(self.Pd4Web.PROJECT_ROOT, patchLine.Tokens[3])
                            if os.path.exists(localPath):
                                for _, _, files in os.walk(localPath):
                                    for file in files:
                                        if file.endswith(".pd"):
                                            obj_name = file.split(".pd")[0]
                                            self.Pd4Web.declaredLocalAbs.append(obj_name)
                # check if it is a comment
                else:
                    self.patchLinesProcessed.append(patchLine)
            else:
                self.patchObject(patchLine)

    def reConfigurePatch(self):
        """
        Reconfigures the patch file for the project.
        Pd4Web compile as objects as native objects, so we need to remove
        the preffix of the Libraries.
        """
        if not self.isAbstraction:
            if not os.path.exists(self.Pd4Web.PROJECT_ROOT + "/WebPatch/"):
                os.mkdir(self.Pd4Web.PROJECT_ROOT + "/WebPatch/")
            patchFile = self.Pd4Web.PROJECT_ROOT + "/WebPatch/index.pd"
        else:
            if not os.path.exists(self.Pd4Web.PROJECT_ROOT + "/.tmp/"):
                os.mkdir(self.Pd4Web.PROJECT_ROOT + "/.tmp/")
            patchFile = self.Pd4Web.PROJECT_ROOT + "/.tmp/" + os.path.basename(self.patchFile)
        with open(patchFile, "w") as f:
            for line in self.patchLinesProcessed:
                if (line.isExternal or line.isAbstraction or line.uiReceiver) and not line.objwithSlash:
                    obj = line.Tokens[4].split("/")
                    if len(obj) > 1:
                        line.Tokens[4] = obj[-1]
                    if line.Tokens[-2] == "f" and line.Tokens[-1].isdigit():
                        line.Tokens[-3] = line.Tokens[-3] + ","
                    f.write(" ".join(line.Tokens) + ";\n")
                else:
                    f.write(line.completLine)

    def objThatIsSingleLib(self, patchLine: PatchLine):
        '''
        This function will check if the object is a single library object. For example earplug~, ambi~, and others
        '''
        if patchLine.Tokens[0] == "#X" and patchLine.Tokens[1] == "obj":
            supportedLibs = self.Pd4Web.Libraries.SupportedLibraries
            libs = [lib["Name"] for lib in supportedLibs]
            if patchLine.Tokens[4] in libs:
                return True
            else:
                return False
        else:
            return False

    def objInDeclaredLib(self, patchLine: PatchLine):
        """ """
        declaredObjs = []
        externalsJson = os.path.join(self.PROJECT_ROOT, "Pd4Web/Externals/Objects.json")
        if not os.path.exists(externalsJson):
            return False
        librariesCount = 0
        libName = ""

        # list of all objects/abs declared in one library
        file = open(externalsJson, "r")
        externalsDict = json.load(file)
        file.close()

        for lib in self.Pd4Web.declaredLibsObjs:
            declaredObjs.extend(externalsDict[lib]["objs"])
            if patchLine.completName in declaredObjs:
                libName = lib
                librariesCount += 1

        if librariesCount > 0:
            if librariesCount > 1:
                pd4web_print(
                    f"Object {patchLine.completName} is in more than one library, using the first declared.",
                    color="yellow",
                    silence=self.Pd4Web.SILENCE,
                    pd4web=self.Pd4Web.PD_EXTERNAL,
                )
            patchLine.library = libName
            return True
        return False

    def absInDeclaredPath(self, patchLine: PatchLine):
        """
        Libraries like else has a lot of abstractions that must be used with [declare -path else],
        this function make the work to make these patches avaible.
        """
        externalsJson = os.path.join(self.PROJECT_ROOT, "Pd4Web/Externals/Objects.json")
        if not os.path.exists(externalsJson):
            return False
        librariesCount = 0
        libName = ""
        with open(externalsJson, "r") as file:
            externalsDict = json.load(file)
            for lib in self.Pd4Web.declaredPaths:
                if lib not in externalsDict.keys():
                    raise Exception(f"Library {lib} not found in {externalsJson}")

                self.declaredAbs.extend(externalsDict[lib]["abs"])
                if patchLine.completName in self.declaredAbs:
                    libName = lib
                    librariesCount += 1

        if librariesCount > 0:
            if librariesCount > 1:
                pd4web_print(
                    f"Abstraction {patchLine.completName} is in more than one library, using the first declared.",
                    color="yellow",
                    silence=self.Pd4Web.SILENCE,
                    pd4web=self.Pd4Web.PD_EXTERNAL,
                )
            patchLine.library = libName
            return True
        return False

    def processClone(self, line: PatchLine):
        args = ["-do", "-di", "-x", "-s"]
        lastToken = ""
        tokens = line.Tokens[5:]
        cloneAbs = ""
        #print(tokens)
        for token in tokens:
            if token not in args and lastToken not in ["-x", "-s"]:
                # check if clone has / in the name
                if os.path.exists(self.PROJECT_ROOT + "/" + token + ".pd"):
                    cloneAbs = token
                elif token in self.declaredAbs:
                    cloneAbs = token
                
                if cloneAbs != "":
                    break
                
                if "/" in token:
                    library = token.split("/")[0]
                    absPatch = token.split("/")[-1]
                    if self.Pd4Web.Libraries.isSupportedLibrary(library):
                        if absPatch in self.Pd4Web.Objects.GetSupportedObjects(library):
                            cloneAbs = absPatch
                            break  
            lastToken = token
            
        if cloneAbs != "":
            if os.path.exists(self.PROJECT_ROOT + "/" + cloneAbs + ".pd"):
                pd4web_print(
                    f"Found Clone Abstraction: {cloneAbs}",
                    color="blue",
                    silence=self.Pd4Web.SILENCE,
                    pd4web=self.Pd4Web.PD_EXTERNAL,
                )
                line.isAbstraction = True
                Patch(
                    self.Pd4Web,
                    isabs=True,
                    patch=self.PROJECT_ROOT + "/" + cloneAbs + ".pd",
                )
                #self.Pd4Web.processedAbs.append(self.PROJECT_ROOT + "/" + cloneAbs + ".pd")
            clonePathFound = False
            for lib in self.Pd4Web.declaredPaths:
                libPath = os.path.join(self.PROJECT_ROOT, "Pd4Web/Externals", lib)
                for root, _, files in os.walk(libPath):
                    for file in files:
                        if file == cloneAbs + ".pd":
                            clonePathFound = True
                            if os.path.join(root, file) not in self.Pd4Web.processedAbs:
                                Patch(
                                    self.Pd4Web,
                                    isabs=True,
                                    patch=os.path.join(root, file),
                                )
            if not clonePathFound:
                raise Exception(f"Clone Abstraction {cloneAbs} not found in {self.patchFile}")
        else:
            raise Exception(f"Clone Abstraction not found in {self.patchFile}")
                                

    def patchObject(self, line: PatchLine):
        """ """
        line.completName = line.Tokens[4]
        library = line.Tokens[4].split("/")[0]
        if self.Pd4Web.Libraries.isSupportedLibrary(library):
            self.Pd4Web.Objects.GetSupportedObjects(line.library)
        if self.checkIfIsLibObj(line) and self.checkIfIsSlashObj(line):               
            # Local Abstraction
            if os.path.exists(self.PROJECT_ROOT + "/" + line.Tokens[4] + ".pd"):
                name = line.Tokens[4].split("/")[-1]
                externalSpace = 19 - len(name)
                name = name + (" " * externalSpace)
                pd4web_print(
                    f"Found Local Abs: {name}  | Path: {library}",
                    color="green",
                    silence=self.Pd4Web.SILENCE,
                    pd4web=self.Pd4Web.PD_EXTERNAL,
                )
                line.isAbstraction = True
                Patch(
                    self.Pd4Web,
                    isabs=True,
                    patch=self.PROJECT_ROOT + "/" + line.Tokens[4] + ".pd",
                )
                #self.absProcessed.append(self.PROJECT_ROOT + "/" + line.Tokens[4] + ".pd")

            # Library Abstraction
            elif self.isLibAbs(line):
                name = line.Tokens[4].split("/")[-1]
                library = line.Tokens[4].split("/")[0]
                externalSpace = 16 - len(name)
                
                name = name + (" " * externalSpace)
                pd4web_print(
                    f"Found External Abs: {name}  | Path: {library}",
                    color="green",
                    silence=self.Pd4Web.SILENCE,
                    pd4web=self.Pd4Web.PD_EXTERNAL,
                )
                Patch(
                    self.Pd4Web,
                    isabs=True,
                    patch=line.absPath,
                )
                #self.Pd4Web.processedAbs.append(line.absPath)
                line.isAbstraction = True
                line.isExternal = False

            # External Object
            else:
                line.isExternal = True
                line.library = line.Tokens[4].split("/")[0]
                line.name = line.completName.split("/")[-1]
                externalSpace = 20 - len(line.name)
                objName = line.name + (" " * externalSpace)
                pd4web_print(
                    f"Found External: {objName}  | Lib: {line.library}",
                    color="green",
                    silence=self.Pd4Web.SILENCE,
                    pd4web=self.Pd4Web.PD_EXTERNAL,
                )

        elif line.completName in self.Pd4Web.declaredLocalAbs:
            for possibleLocal in self.declaredLocalPaths:
                if os.path.exists(self.PROJECT_ROOT + "/" + possibleLocal + "/" + line.completName + ".pd"):
                    line.isAbstraction = True
                    line.library = possibleLocal
                    line.name = line.completName
                    pd4web_print(
                        f"Found Local Abstraction: {line.name}  | Path: {line.library}",
                        color="green",
                        silence=self.Pd4Web.SILENCE,
                        pd4web=self.Pd4Web.PD_EXTERNAL,
                    )
                    Patch(
                        self.Pd4Web,
                        isabs=True,
                        patch=self.PROJECT_ROOT + "/" + possibleLocal + "/" + line.completName + ".pd",
                    )
                    #self.absProcessed.append(self.PROJECT_ROOT + "/" + possibleLocal + "/" + line.completName + ".pd")
                    line.isAbstraction = True
                    line.localAbs = True

        elif self.objThatIsSingleLib(line):
            line.isExternal = True
            line.library = line.completName
            line.name = line.completName
            line.objGenSym = 'class_new(gensym("' + line.name + '")'

        elif self.objInDeclaredLib(line):
            line.isExternal = True
            line.name = line.completName

        elif self.absInDeclaredPath(line):
            line.isAbstraction = True
            line.name = line.completName

        elif self.tokenIsFloat(line.Tokens[4]) != float("inf"):
            line.name = line.completName
            line.isExternal = False

        elif line.completName == "clone":
            self.processClone(line)

        elif self.tokenIsDollarSign(line.Tokens[4]):
            line.name = line.completName
            line.isExternal = False
        else:
            if line.completName in self.Pd4Web.Objects.GetSupportedObjects("pure-data"):
                line.name = line.completName
                line.isExternal = False
            elif line.completName in self.localAbstractions:
                line.name = line.completName
                pd4web_print(
                    "Local Abstraction: " + line.name,
                    color="green",
                    silence=self.Pd4Web.SILENCE,
                    pd4web=self.Pd4Web.PD_EXTERNAL,
                )
            else:
                msg = f"Library or Object can't be processed, please report: ["
                tokens = line.Tokens[4:]
                msg += " ".join(tokens) + "]"
                msg += f" inside {self.patchFile}"
                raise ValueError(msg)

        # Finally
        if (line.isExternal or line.isAbstraction) and (line.library != "pure-data" and not line.localAbs):
            libClass = self.Pd4Web.Libraries.GetLibraryData(line.library)
            if libClass.valid:
                if line.name in libClass.unsupported:
                    if self.Pd4Web.BYPASS_UNSUPPORTED:
                        pd4web_print(
                            f"Unsupported object: {line.name}",
                            color="yellow",
                            silence=self.Pd4Web.SILENCE,
                            pd4web=self.Pd4Web.PD_EXTERNAL,
                        )
                    else:
                        raise ValueError(f"The object {line.name} from {line.library} is not supported by Pd4Web yet.")
            else:
                msg = f"Library or Object can't be processed, please report: ["
                tokens = line.Tokens[4:]
                msg += " ".join(tokens) + "]"
                msg += f" inside {self.patchFile}"
                raise ValueError(msg)

        if self.Pd4Web.Libraries.isSupportedLibrary(line.library):
            self.Pd4Web.Objects.GetSupportedObjects(line.library)
            if line.library not in self.Pd4Web.declaredLibsObjs:
                self.Pd4Web.declaredLibsObjs.append(line.library)
            if line.library not in self.Pd4Web.declaredPaths:
                self.Pd4Web.declaredPaths.append(line.library)
        
        self.searchForGuiObject(line)
        self.searchForSpecialObject(line)
        self.patchLinesProcessed.append(line)
        self.addUsedObject(line)

    def addUsedObject(self, PatchLine: PatchLine):
        if (
            not any(obj["Lib"] == PatchLine.library and obj["Obj"] == PatchLine.name for obj in self.Pd4Web.usedObjects)
            and PatchLine.isExternal
        ):
            self.Pd4Web.usedObjects.append(
                {
                    "Lib": PatchLine.library,
                    "Obj": PatchLine.name,
                    "SetupFunction": PatchLine.setupFunction,
                }
            )

    def __str__(self):
        return f"< Patch: {os.path.basename(self.patchFile)} | {len(self.patchLinesProcessed)} objects >"

    def __repr__(self):
        return self.__str__()
