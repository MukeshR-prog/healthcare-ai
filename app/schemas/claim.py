from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class ClaimCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    provider: str = Field(validation_alias=AliasChoices("provider", "Provider"))
    age: int = Field(validation_alias=AliasChoices("age", "Age"))
    claim_amount: float = Field(validation_alias=AliasChoices("claim_amount", "ClaimAmount"))
    num_procedures: int = Field(validation_alias=AliasChoices("num_procedures", "NumProcedures"))
    gender: str = Field(validation_alias=AliasChoices("gender", "Gender"))

    def to_ml_payload(self) -> dict:
        return {
            "Provider": self.provider,
            "Age": self.age,
            "ClaimAmount": self.claim_amount,
            "NumProcedures": self.num_procedures,
            "Gender": self.gender,
        }

    def to_db_payload(self) -> dict:
        return {
            "provider": self.provider,
            "age": self.age,
            "claim_amount": self.claim_amount,
            "num_procedures": self.num_procedures,
            "gender": self.gender,
        }
