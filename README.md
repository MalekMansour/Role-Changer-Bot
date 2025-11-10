# Role Changer Bot

A simple Discord bot that lets users change their own role from a select menu.  
Only specific roles (defined by you) can be selected, and only certain users or admins can access the command.

---

## Features
- `/role change` — lets a user pick a new role from a dropdown list.  
- Automatically removes any previously assigned role before adding the new one.  
- Restricts access to certain users or roles (optional).  
- Safe permission checks — the bot only changes roles it has access to.  

---

## Command Usage

Once the bot is running:

1. Type `/role change` in your server.  
2. Select your desired role from the dropdown.  
3. The bot will remove your previous role and add the new one.  

---

## Notes
- The bot’s **role must be higher** than the roles it assigns.  
  *(Move it to the top of your server’s role list.)*  
- Requires the **Manage Roles** permission.  
- Roles that no longer exist are skipped automatically.  

---
