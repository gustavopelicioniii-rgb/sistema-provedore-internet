#!/usr/bin/env python3
"""
Mikrotik REST API Client
Uso: python mikrotik_api.py <comando> [args]
"""

import requests
import json
import sys
from typing import Optional

class MikrotikAPI:
    def __init__(self, host: str, user: str, password: str, port: int = 8728):
        self.host = host
        self.user = user
        self.password = password
        self.port = port
        self.base_url = f"http://{host}:{port}/rest"
        self.session = requests.Session()
        self.session.auth = (user, password)
    
    def get(self, path: str) -> list:
        """GET request to Mikrotik"""
        resp = self.session.get(f"{self.base_url}{path}")
        resp.raise_for_status()
        return resp.json()
    
    def put(self, path: str, data: dict) -> dict:
        """PUT (create/update) request"""
        resp = self.session.put(f"{self.base_url}{path}", json=data)
        resp.raise_for_status()
        return resp.json()
    
    def delete(self, path: str) -> bool:
        """DELETE request"""
        resp = self.session.delete(f"{self.base_url}{path}")
        return resp.status_code == 204
    
    # PPPoE Secrets
    def list_secrets(self) -> list:
        return self.get("/ppp/secret")
    
    def create_secret(self, name: str, password: str, profile: str, remote_address: str = "0.0.0.0") -> dict:
        return self.put("/ppp/secret", {
            "name": name,
            "password": password,
            "profile": profile,
            "remote-address": remote_address,
            "service": "pppoe"
        })
    
    def delete_secret(self, name: str) -> bool:
        return self.delete(f"/ppp/secret/{name}")
    
    def enable_secret(self, name: str) -> dict:
        return self.put(f"/ppp/secret/{name}", {"disabled": "false"})
    
    def disable_secret(self, name: str) -> dict:
        return self.put(f"/ppp/secret/{name}", {"disabled": "true"})
    
    # PPP Profiles
    def list_profiles(self) -> list:
        return self.get("/ppp/profile")
    
    def create_profile(self, name: str, local_address: str, remote_address: str, 
                       rate_limit: str = "10M/10M") -> dict:
        """rate_limit format: '10M/10M' = 10Mbps up/down"""
        return self.put("/ppp/profile", {
            "name": name,
            "local-address": local_address,
            "remote-address": remote_address,
            "rate-limit": rate_limit,
            "bridge": "bridge-lan"
        })
    
    # Queues
    def list_queues(self) -> list:
        return self.get("/queue/simple")
    
    def create_queue(self, name: str, target: str, rate: str, burst: str = "") -> dict:
        data = {
            "name": name,
            "target": target,
            "rate": rate,
            "priority": "8/8"
        }
        if burst:
            data["burst"] = burst
        return self.put("/queue/simple", data)
    
    # System
    def reboot(self) -> dict:
        return self.put("/system/reboot", {"reboot": ""})
    
    def get_resources(self) -> dict:
        return self.get("/system/resource")


def main():
    if len(sys.argv) < 2:
        print("Uso: mikrotik_api.py <comando> [args]")
        print("Comandos:")
        print("  list-secrets          - Lista usuários PPPoE")
        print("  create-secret <user> <pass> <profile> - Cria usuário")
        print("  delete-secret <user>  - Remove usuário")
        print("  disable-secret <user> - Desabilita usuário")
        print("  enable-secret <user>  - Habilita usuário")
        print("  list-profiles         - Lista profiles")
        print("  resources             - Info do sistema")
        sys.exit(1)
    
    # Config - ajuste para seu ambiente
    api = MikrotikAPI(
        host="192.168.1.1",
        user="admin", 
        password="sua_senha",
        port=8728
    )
    
    cmd = sys.argv[1]
    
    try:
        if cmd == "list-secrets":
            secrets = api.list_secrets()
            print(json.dumps(secrets, indent=2))
            
        elif cmd == "list-profiles":
            profiles = api.list_profiles()
            print(json.dumps(profiles, indent=2))
            
        elif cmd == "resources":
            resources = api.get_resources()
            print(json.dumps(resources, indent=2))
            
        elif cmd == "create-secret" and len(sys.argv) >= 5:
            name, password, profile = sys.argv[2], sys.argv[3], sys.argv[4]
            result = api.create_secret(name, password, profile)
            print(f"✅ Usuário {name} criado!")
            print(json.dumps(result, indent=2))
            
        elif cmd == "delete-secret" and len(sys.argv) >= 3:
            name = sys.argv[2]
            api.delete_secret(name)
            print(f"🗑️ Usuário {name} removido!")
            
        elif cmd == "disable-secret" and len(sys.argv) >= 3:
            name = sys.argv[2]
            api.disable_secret(name)
            print(f"⏸️ Usuário {name} desabilitado!")
            
        elif cmd == "enable-secret" and len(sys.argv) >= 3:
            name = sys.argv[2]
            api.enable_secret(name)
            print(f"▶️ Usuário {name} habilitado!")
            
        else:
            print(f"❌ Comando desconhecido: {cmd}")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Erro: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
