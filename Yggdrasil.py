# python3 Yggdrasil.py 
from mega import Mega
from datetime import datetime
from zoneinfo import ZoneInfo

localFolder = ""
pathDb = ""
pathFwl = ""

def initialize():
    global pathDb, pathFwl, localFolder
    # read the path and world name from Path.Ygg
    print("Initializing...")
    file = open("Path.Ygg", "r")
    localFolder = file.readline().rstrip()
    worldName = file.readline().rstrip()
    pathDb = localFolder + "/" + worldName + ".db"
    pathFwl = localFolder + "/" + worldName + ".fwl"

    print("    Local: " + localFolder)
    print("    Nome do Mundo: " + worldName + "\n")

def backup():
    # altera o nome do ultimo save da nuvem adicionando a data atual no final
    print("Making Backup...")
    date = datetime.now(ZoneInfo('America/Sao_Paulo'))

    try :
        oldSaveDb = m.find("ValheimWorld/" + pathDb, exclude_deleted=True)
        m.rename(oldSaveDb, pathDb + date.strftime(" %Y-%m-%d-%H:%M:%S"))

        oldSaveFwl = m.find("ValheimWorld/" + pathFwl, exclude_deleted=True)
        m.rename(oldSaveFwl, pathFwl + date.strftime(" %Y-%m-%d-%H:%M:%S"))
    except:
        print(" - Nenhum arquivo encontrado para fazer backup")

def upload():
    # Sobe os 2 arquivos para o Mega
    print("Uploading...")
    print(pathDb)
    print(pathFwl)
    folder = m.find("ValheimWorld", exclude_deleted=True)
    m.upload(pathDb, folder[0])
    m.upload(pathFwl, folder[0])

def download():
    # Substitui os arquivos locais pelos que estão no Mega
    print("Downloading...")
    file = m.find('ValheimWorld/' + pathDb, exclude_deleted=True)
    m.download(file, localFolder)
    file = m.find('ValheimWorld/' + pathFwl, exclude_deleted=True)
    m.download(file, localFolder)



initialize()
#quit()

mega = Mega()
print("Login in... (Heimdall is examining yout ID)")
m = mega.login("artgames100@gmail.com", "t2h0o0r9")
print("you're fit to cross the Bifröst\n")

print("Enter Input")
print(" - up: sobe o seu save local para a nuvem")
print(" - down: substitui o save local pelo save da nuvem")
print(" - exit: fecha o programa\n")
while 1:
    inpt = input("> ")
    if inpt == "up":
        backup()
        upload()
        print("Finished")

    elif inpt == "down":
        download()
        print("Finished")

    elif inpt == "exit":
        print("Exiting (closing the Bifröst)")
        quit()

    else:
        print("Erro: o Comando -" + inpt + "- não existe!")
    