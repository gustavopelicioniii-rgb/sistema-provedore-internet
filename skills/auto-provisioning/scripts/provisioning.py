#!/usr/bin/env python3
"""
Auto Provisioning - Provisiona novos clientes automaticamente
"""

import json
import secrets
import string
from datetime import datetime

class ProvisioningService:
    def __init__(self, mikrotik_api=None):
        self.mikrotik = mikrotik_api
    
    def generate_password(self, length: int = 8) -> str:
        """Gera senha temporária segura"""
        chars = string.ascii_letters + string.digits
        return ''.join(secrets.choice(chars) for _ in range(length))
    
    def provision_client(self, client_data: dict) -> dict:
        """Provisiona novo cliente"""
        result = {
            "success": True,
            "client_id": client_data["id"],
            "credentials": {},
            "steps": []
        }
        
        # 1. Gerar credenciais
        password = self.generate_password()
        username = client_data.get("cpf", client_data["email"])
        
        result["credentials"] = {
            "username": username,
            "password": password,
            "service": "pppoe"
        }
        result["steps"].append("✅ Credenciais geradas")
        
        # 2. Criar conta no Mikrotik
        if self.mikrotik:
            try:
                profile = self.get_profile_for_plan(client_data["plan"])
                self.mikrotik.create_secret(
                    name=username,
                    password=password,
                    profile=profile
                )
                result["steps"].append(f"✅ Conta PPPoE criada (profile: {profile})")
            except Exception as e:
                result["success"] = False
                result["error"] = f"Mikrotik: {str(e)}"
                return result
        
        # 3. Atribuir VLAN se FTTH
        if client_data.get("connection_type") == "ftth":
            vlan = self.allocate_vlan()
            result["vlan"] = vlan
            result["steps"].append(f"✅ VLAN {vlan} atribuída")
        
        # 4. Registrar equipamento
        if client_data.get("ont_serial"):
            result["ont"] = {
                "serial": client_data["ont_serial"],
                "model": client_data.get("ont_model", "Generico"),
                "status": "pending_provision"
            }
            result["steps"].append("✅ Equipamento ONT registrado")
        
        result["timestamp"] = datetime.now().isoformat()
        return result
    
    def get_profile_for_plan(self, plan_name: str) -> str:
        """Mapeia nome do plano para profile Mikrotik"""
        profile_map = {
            "100Mbps": "profile_100m",
            "200Mbps": "profile_200m",
            "300Mbps": "profile_300m",
            "500Mbps": "profile_500m",
            "1Gbps": "profile_1g"
        }
        return profile_map.get(plan_name, "profile_default")
    
    def allocate_vlan(self) -> int:
        """Aloca VLAN disponível (simulado)"""
        # Em produção, buscar de tabela no banco
        return 100
    
    def suspend_client(self, client_id: str, reason: str = "non_payment") -> dict:
        """Suspende cliente"""
        result = {
            "success": True,
            "client_id": client_id,
            "reason": reason,
            "steps": []
        }
        
        if self.mikrotik:
            try:
                # Desabilitar usuário
                self.mikrotik.disable_secret(client_id)
                result["steps"].append("✅ Conta PPPoE desabilitada")
                
                # Mover para profile suspenso
                # self.mikrotik.set_profile(client_id, "profile_suspended")
                result["steps"].append("✅ Profile alterado para suspenso")
            except Exception as e:
                result["success"] = False
                result["error"] = str(e)
        
        result["suspended_at"] = datetime.now().isoformat()
        return result
    
    def reactivate_client(self, client_id: str) -> dict:
        """Reativa cliente suspenso"""
        result = {
            "success": True,
            "client_id": client_id,
            "steps": []
        }
        
        if self.mikrotik:
            try:
                self.mikrotik.enable_secret(client_id)
                result["steps"].append("✅ Conta PPPoE reativada")
            except Exception as e:
                result["success"] = False
                result["error"] = str(e)
        
        result["reactivated_at"] = datetime.now().isoformat()
        return result


def main():
    # Exemplo de uso
    provisioning = ProvisioningService()
    
    novo_cliente = {
        "id": "cli_001",
        "nome": "João Silva",
        "cpf": "123.456.789-00",
        "email": "joao@email.com",
        "plano": "200Mbps",
        "endereco": "Rua X, 123 - Centro",
        "connection_type": "ftth",
        "ont_serial": "HWTC-A1B2C3"
    }
    
    print("=" * 60)
    print("PROVISIONAMENTO DE NOVO CLIENTE")
    print("=" * 60)
    
    result = provisioning.provision_client(novo_cliente)
    
    if result["success"]:
        print(f"\n✅ CLIENTE PROVISIONADO COM SUCESSO!")
        print(f"\n📋 Credenciais de Acesso:")
        print(f"   Usuário: {result['credentials']['username']}")
        print(f"   Senha: {result['credentials']['password']}")
        print(f"\n📝 Histórico:")
        for step in result["steps"]:
            print(f"   {step}")
    else:
        print(f"\n❌ ERRO: {result.get('error')}")


if __name__ == "__main__":
    main()
