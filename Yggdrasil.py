# python3 Yggdrasil.py 
from mega import Mega
from datetime import datetime
from zoneinfo import ZoneInfo

localFolder = "/home/arthur/Documents"
fileNameDb = "YggTeste.db"
fileNameFwl = "YggTeste.fwl"

def backup():
    print("Making Backup...")
    date = datetime.now(ZoneInfo('America/Sao_Paulo'))

    try :
        oldSaveDb = m.find("ValheimWorld/" + fileNameDb, exclude_deleted=True)
        m.rename(oldSaveDb, fileNameDb + date.strftime(" %Y-%m-%d-%H:%M:%S"))

        oldSaveFwl = m.find("ValheimWorld/" + fileNameFwl, exclude_deleted=True)
        m.rename(oldSaveFwl, fileNameFwl + date.strftime(" %Y-%m-%d-%H:%M:%S"))
    except:
        print(" - Nenhum arquivo encontrado para fazer backup")

def upload():
    print("Uploading...")
    folder = m.find("ValheimWorld", exclude_deleted=True)
    m.upload(localFolder + "/" + fileNameDb, folder[0])
    m.upload(localFolder + "/" + fileNameFwl, folder[0])

def download():
    print("Downloading...")
    file = m.find('ValheimWorld/' + fileNameDb, exclude_deleted=True)
    m.download(file, localFolder)
    file = m.find('ValheimWorld/' + fileNameFwl, exclude_deleted=True)
    m.download(file, localFolder)



print("Initializing...")
mega = Mega()

print("Login in... (Heimdall is examining yout ID)")
m = mega.login("artgames100@gmail.com", "t2h0o0r9")
print("you're fit to cross the Bifröst\n")

print("Enter Input")
print(" - upload: sobe o seu save local para a nuvem")
print(" - download: substitui o save local pelo save da nuvem")
print(" - exit: fecha o programa\n")
while 1:
    inpt = input("> ")
    if inpt == "upload":
        backup()
        upload()
        print("Finished")

    elif inpt == "download":
        download()
        print("Finished")

    elif inpt == "exit":
        print("Exiting (closing the Bifröst)")
        quit()

    else:
        print("Erro: o Comando -" + inpt + "- não existe!")
    