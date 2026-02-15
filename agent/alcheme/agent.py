"""alche:me ADK Agent — Entry point.

This module exports `root_agent`, which is required by the ADK runner.
Run with:  adk web alcheme
"""

from .agents.inventory import create_inventory_agent
from .agents.product_search import create_product_search_agent
from .agents.alchemist import create_alchemist_agent
from .agents.concierge import create_concierge_agent

# Build sub-agents
inventory_agent = create_inventory_agent()
product_search_agent = create_product_search_agent()
alchemist_agent = create_alchemist_agent()

# Build root agent (Concierge) with sub-agents
root_agent = create_concierge_agent(
    sub_agents=[inventory_agent, product_search_agent, alchemist_agent],
)
