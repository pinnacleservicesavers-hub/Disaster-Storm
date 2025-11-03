import uuid
class Store:
    def __init__(self):
        self.users={}; self.sessions={}; self.leads={}; self.jobs={}; self.invoices={}; self.memberships={}; self.settings={}
    def new_id(self): return str(uuid.uuid4())
store=Store()
