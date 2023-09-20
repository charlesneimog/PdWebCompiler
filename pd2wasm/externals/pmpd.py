import os
import shutil

def pmpd_extra(librarySelf):
    '''
    This function copy some things that I already need to compile some externals in cyclone
    '''
    # print in orange, executing earplug function
    if librarySelf.extraFuncExecuted:
        return

    if not os.path.exists(os.path.join(librarySelf.PROJECT_ROOT, "webpatch", "includes")):
        os.makedirs(os.path.join(librarySelf.PROJECT_ROOT, "webpatch", "includes"))


    folder = librarySelf.folder
   
    # search for pmpd.h and pmpd_version.h and copy to externals folder
    for root, _, files in os.walk(folder):
        for file in files:
            if file == "pmpd.h":
                shutil.copy(os.path.join(root, file), os.path.join(librarySelf.PROJECT_ROOT, "webpatch", "includes", "pmpd.h"))
            if file == "pmpd_version.h":
                shutil.copy(os.path.join(root, file), os.path.join(librarySelf.PROJECT_ROOT, "webpatch", "includes", "pmpd_version.h"))
            if file == "pmpd2d.h":
                shutil.copy(os.path.join(root, file), os.path.join(librarySelf.PROJECT_ROOT, "webpatch", "includes", "pmpd2d.h"))
            if file == "pmpd3d.h":
                shutil.copy(os.path.join(root, file), os.path.join(librarySelf.PROJECT_ROOT, "webpatch", "includes", "pmpd3d.h"))











