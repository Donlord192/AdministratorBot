const { Telegraf } = require('telegraf');
const bot = new Telegraf('6463347903:AAG0pLAD-4YMBMGRx26oPZ1Rs7BKTAbgIBA');

// Приветственное сообщение и напоминание о правилах
const welcomeMessage = (name, groupName) => `
Добро пожаловать, ${name}!

Вы вступили в группу "${groupName}". Пожалуйста, ведите себя нормально и культурно, уважайте других участников группы.
`;

// Функция для приветствия нового пользователя
bot.on('new_chat_members', (ctx) => {
  const groupName = ctx.chat.title; // Получаем название группы
  ctx.message.new_chat_members.forEach((member) => {
    const name = member.first_name || "участник";
    console.log(`Приветствуем нового участника: ${name}`);
    ctx.reply(welcomeMessage(name, groupName));
  });
});

// Хранилище для отслеживания сообщений пользователей
const userMessages = {};

// Функция для обработки сообщений
bot.on('message', async (ctx) => {
  const userId = ctx.from.id;

  try {
    const chatMember = await ctx.getChatMember(userId);

    // Пропускаем владельца и администраторов чата
    if (['creator', 'administrator'].includes(chatMember.status)) {
      return;
    }

    // Инициализация счетчика сообщений пользователя, если он не существует
    if (!userMessages[userId]) {
      userMessages[userId] = { count: 0, lastMessageTime: Date.now() };
    }

    const currentTime = Date.now();
    const timeDifference = currentTime - userMessages[userId].lastMessageTime;

    // Если сообщения поступают слишком часто (например, чаще чем 3 сообщения в 10 секунд)
    if (timeDifference < 10000) {
      userMessages[userId].count += 1;

      if (userMessages[userId].count > 3) {
        // Ограничиваем пользователя на 1 минуту
        await ctx.restrictChatMember(userId, {
          permissions: { can_send_messages: false },
          until_date: Math.floor(Date.now() / 1000) + 300,
        });

        ctx.reply(`@${ctx.from.username} был временно ограничен за спам.`);

        // Сбрасываем счетчик сообщений
        userMessages[userId].count = 0;
      }
    } else {
      // Сбрасываем счетчик сообщений, если прошло достаточно времени
      userMessages[userId].count = 1;
    }

    userMessages[userId].lastMessageTime = currentTime;
  } catch (error) {
    console.error('Ошибка при проверке статуса пользователя:', error);
  }
});

bot.launch().then(() => {
  console.log('Бот запущен');
});

// Обработка SIGINT и SIGTERM для корректного завершения работы бота
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));