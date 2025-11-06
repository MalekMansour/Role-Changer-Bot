import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionsBitField,
} from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const ASSIGNABLE_ROLES = [
  "1357511240792145930",
  "1435118930044784690",
  "1365150999366467585",
  "1365754781410394222",
  "1369941574011846747",
  "1387933824167575653",
  "1398068935508627509",
  "1424989252470439996",
  "1425029865874395157",
  "1433702088730476637",
  "1435139665115217920",
];

const ALLOWED_TO_USE = [];

if (!TOKEN || !CLIENT_ID) {
  console.error("❌ ERROR: Set TOKEN and CLIENT_ID in your .env file.");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

const commands = [
  new SlashCommandBuilder()
    .setName("role")
    .setDescription("Role selection command")
    .addSubcommand((sub) =>
      sub.setName("change").setDescription("Choose your new role")
    )
    .toJSON(),
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

async function registerCommands() {
  try {
    if (GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
      });
      console.log(`✅ Registered commands to guild ${GUILD_ID}`);
    } else {
      await rest.put(Routes.applicationCommands(CLIENT_ID), {
        body: commands,
      });
      console.log("✅ Registered global commands (may take up to 1 hour)");
    }
  } catch (err) {
    console.error("❌ Failed to register commands:", err);
  }
}

client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  registerCommands();
});

// ==== Interaction Handling ====
client.on("interactionCreate", async (interaction) => {
  try {
    // Handle slash command
    if (interaction.isChatInputCommand()) {
      if (
        interaction.commandName === "role" &&
        interaction.options.getSubcommand() === "change"
      ) {
        // Check permission
        if (ALLOWED_TO_USE.length > 0) {
          const member = interaction.member;
          const allowed =
            ALLOWED_TO_USE.some((r) => member.roles.cache.has(r)) ||
            member.permissions.has(PermissionsBitField.Flags.Administrator);

          if (!allowed) {
            return interaction.reply({
              content: "🚫 You don’t have permission to use this command.",
              ephemeral: true,
            });
          }
        }

        // Build the select menu
        const options = ASSIGNABLE_ROLES.map((roleId) => {
          const role = interaction.guild.roles.cache.get(roleId);
          if (!role) return null;
          return {
            label: role.name.substring(0, 100),
            value: roleId,
            description: `Select ${role.name}`.substring(0, 100),
          };
        }).filter(Boolean);

        if (options.length === 0) {
          return interaction.reply({
            content: "⚠️ No valid assignable roles found in this server.",
            ephemeral: true,
          });
        }

        const menu = new StringSelectMenuBuilder()
          .setCustomId("role_select")
          .setPlaceholder("Choose your new role")
          .addOptions(options);

        const row = new ActionRowBuilder().addComponents(menu);

        return interaction.reply({
          content: "Pick your new role:",
          components: [row],
          ephemeral: true,
        });
      }
    }

    // Handle role selection
    if (interaction.isStringSelectMenu() && interaction.customId === "role_select") {
      const selectedRoleId = interaction.values[0];
      const selectedRole = interaction.guild.roles.cache.get(selectedRoleId);
      const member = await interaction.guild.members.fetch(interaction.user.id);

      if (!selectedRole) {
        return interaction.update({
          content: "⚠️ That role no longer exists.",
          components: [],
          ephemeral: true,
        });
      }

      const botMember = await interaction.guild.members.fetch(client.user.id);
      if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return interaction.update({
          content: "❌ I need the **Manage Roles** permission to assign roles.",
          components: [],
          ephemeral: true,
        });
      }

      if (botMember.roles.highest.position <= selectedRole.position) {
        return interaction.update({
          content:
            "⚠️ My role must be **higher** than the role you’re trying to assign.",
          components: [],
          ephemeral: true,
        });
      }

      const toRemove = ASSIGNABLE_ROLES.filter(
        (r) => r !== selectedRoleId && member.roles.cache.has(r)
      );

      if (toRemove.length > 0) {
        await member.roles.remove(toRemove, "Changing self role");
      }

      if (!member.roles.cache.has(selectedRoleId)) {
        await member.roles.add(selectedRoleId, "Self role change");
      }

      return interaction.update({
        content: `✅ Your role has been updated to **${selectedRole.name}**!`,
        components: [],
        ephemeral: true,
      });
    }
  } catch (err) {
    console.error("⚠️ Interaction error:", err);
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content: "❌ An error occurred. Please try again.",
          components: [],
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "❌ An error occurred. Please try again.",
          ephemeral: true,
        });
      }
    } catch {}
  }
});

// ==== Start bot ====
client.login(TOKEN);
