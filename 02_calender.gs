/**
 * dateオブジェクトを、yyyy/MM/ddなどの指定した文字列で返す。
 * E - 曜日の指定があった際に　wed → 水　のように変換する
 * 
 * @param  {date} date - dateオブジェクト
 * @param  {sting} format - 'yyyy/MM/dd', 'yyyy/MM/dd HH:mm', 'yyyy/MM/dd (E)'
 * @return {string} （例）2022/04/06
 */
function formatDate(date, format){

  console.info(`formatDate()を実行中`);
  console.info(`02_calenderに記載`);

  const formatDate = Utilities.formatDate(date, 'JST', format);

  if(formatDate.match(/[a-zA-Z]/)!== null){

    // 2022/04/06 (wed) → 2022/04/06 (水)　のように変換
    const day    = convertDay(date.getDay());
    const marged = formatDate.replace(/[a-zA-Z]{3}/, `${day}`);

    console.log(`変換前の表記：　${formatDate}`);
    console.log(`変換後の表記：　${marged}`);
    return marged

  }else{
    //曜日の指定がない場合
    console.log(`日付　：　${formatDate}`);
    return formatDate
  }
}


/**
 * 
 * 今日を起点として、対象日までの日付と曜日の2次元配列として返す
 * 
 * @param  {sting} string - '2023/04/29'のように 'yyyy/MM/dd' 形式で指定する
 * @return {Array.<Array.<string>>}
 * 
 */
function generateDateStringValues(string) {

  console.info(`generateDateStringValues()を実行中`);
  console.info(`02_calenderに記載`);

  const targetDate = new Date(string);
  const today      = new Date();

  let day,stringDate;
  let newValues = [];

  if(targetDate < today){
    // targetDateが、今日の日付より過去の場合
    for(let d = targetDate; d < today; d.setDate(d.getDate()+1)) {
      day        = convertDay(d.getDay());
      stringDate = formatDate(d, 'yyyy/MM/dd');
      newValues.push([stringDate, day]);

    }//for
  }else if(today < targetDate){
    // targetDateが、今日の日付より未来の場合
    for(let d = today; d < targetDate; d.setDate(d.getDate()+1)){
      day        = convertDay(d.getDay());
      stringDate = formatDate(d, 'yyyy/MM/dd');
      newValues.push([stringDate, day]);
    }
  }
  console.log(newValues);
  return newValues
}//end



/**
 * 英語表記の曜日、sat, wedなどを、'日月火水木金土'のいずれかに変換する
 * 
 * @param  {number} tempNumber - date.getDay()
 * @return {string} 
 * 
 */
function convertDay(tempNumber){

  console.info(`convertDay()を実行中`);
  console.info(`02_calenderに記載`);

  // 文字列を配列化
  const dayOfWeek = '日月火水木金土';
  const daysArray = dayOfWeek.split('');
  const day       = daysArray[tempNumber];

  console.log(daysArray);
  console.log(`daysArray[${tempNumber}]　${day}曜日`);

  return day

}



/**
 * 引数にした日時からnカ月後の予定を2次元配列で取得する
 * FIXME:全ての予定を取得しているため、予定がたくさん登録されている場合は　を使用してください
 * 
 * @param  {string} string - 'yyyy/MM/dd'形式で日付を指定　（例）'2023/04/28'
 * @param  {number} offset - nカ月後にあたる　数値で指定
 * @param  {string} calId - カレンダーID
 * @return {Array.<Array.<string>>} 
 * 
 */
function getCalAllEvents(string, offset, calId) {

  console.info(`convertDay()を実行中`);
  console.info(`02_calenderに記載`);

  const cal = calId ? CalendarApp.getCalendarById(calId) : CalendarApp.getDefaultCalendar();
        
  const startTime = new Date(string);
  const endTime   = new Date();
  endTime.setMonth(endTime.getMonth() + offset);

  //指定のカレンダーから予定を取得
  const events = cal.getEvents(startTime, endTime).map(event => ({
    title:       event.getTitle(),
    date:        formatDate(event.getStartTime(), 'yyyy/MM/dd'),
    day:         convertDay(event.getStartTime().getDay()),
    start:       formatDate(event.getStartTime(), 'HH:mm'),
    end:         formatDate(event.getEndTime(), 'HH:mm'),
    description: event.getDescription(),
    guests:      guestList_(event.getGuestList(), event.getCreators())
  }));

  console.log(events);

  const keys   = Object.keys(events[0]);
  const values = events.map(event => keys.map(key => event[key]));

  console.log(`オブジェクトを2次元配列に変換`);
  console.log(values);
  return values

}



/**
 * カレンダーの出席者を取得する
 * 
 * @param  {Array.<string>} guests - 出席者を格納した配列
 * @param  {Array.<string>} creators - 予定の作成者を格納した配列
 * @return {string} 
 * 
 */
function guestList_(guests, creators) {

  console.info(`guestList_()を実行中`);
  console.info(`02_calenderに記載`);

  const guestEmails = guests.map(guest => guest.getEmail());
  
  if (creators) {
    // 主催者を既存の配列の先頭に追加
    const organizers = creators.map(creator => creator[0]);
    guestEmails.unshift(...organizers);
  }

  // 配列を文字列化する
  const guestsList = guestEmails.join();
  return guestsList;
}




/**
 * シートの値に基づいて予定を登録するスクリプト
 * 3番目の引数、calIdについては省略した場合、自分のカレンダーに予定が登録される
 * 
 * @param {string} sheeturl　- スプレッドシートのURL
 * @param {number} rowIndex - ヘッダー行の位置
 * @param {string} calId - カレンダーID　省略可　 (例) *****@gmail.com
 * 
 */
function registerEvents(sheeturl, rowIndex, calId) {

  console.info(`registerEvents()を実行中`);
  console.info(`02_calenderに記載`);

  const sheet  = getSheetByUrl(sheeturl);
  const values = sheet.getDataRange().getValues();
  const column = getHeader_(values, rowIndex);

  // 3番目の引数、calIdが無かった場合、自分のカレンダーIDを使用する
  calId = calId ? calId : CalendarApp.getDefaultCalendar().getId();

  let count = 0;

  values.forEach((row, index) => {
    const eventId   = registerEventIfNotRegistered_(row, column, calId);
    const targetRow = index + 1;

    console.log(`処理対象行；　${targetRow}`);

    if (eventId) {
      sheet.getRange(targetRow, column.eventId + 1).setValue(eventId);
      sheet.getRange(targetRow, column.status + 1).setValue('登録済');
      count += 1;
    }
  });
  
  SpreadsheetApp.getUi().alert(`${count}件の予定を登録しました`);
  
}




/**
 * スプレッドシートの登録ステータスに応じて登録処理を進める関数
 * 
 * @param  {Array.<string|date>} row - 1次元配列
 * @param  {number} index - 処理番号
 * 
 */
function registerEventIfNotRegistered_(row, column, calId) {
  // イベントID or 登録ステータスが空白の場合のみ登録処理を実行する
  if (row[column.eventId] === '' && row[column.status] === '') {

    // イベントの開始時刻
    const startTime = new Date(row[column.date]);
    startTime.setHours(row[column.startTime].getHours());
    startTime.setMinutes(row[column.startTime].getMinutes());

    // イベントの終了時刻
    const endTime = new Date(startTime);
    endTime.setHours(row[column.endTime].getHours());
    endTime.setMinutes(row[column.endTime].getMinutes());

    const eventObject = {
      calId:       calId,
      title:       row[column.title],
      startTime:   Utilities.formatDate(startTime, 'JST', "yyyy-MM-dd'T'HH:mm:ss.000+09:00"),
      endTime:     Utilities.formatDate(endTime, 'JST', "yyyy-MM-dd'T'HH:mm:ss.000+09:00"),
      description: row[column.description],
      attendees:   generateAttendees_(row[column.attendees]),
    }
    return createEventWithMeetUrl_(eventObject);
  }
  return null;
}



/**
 * 新卒面接共有カレンダー登録用のヘッダー行のインデックスを取得する
 * 
 * @param  {Array.<Array.<string|date>>} values - シートの値、2次元配列
 * @return {Object.<number>}
 * 
 */
function getHeader_(values, rowIndex){
  const header = values[rowIndex];
  const column = {
    eventId:     header.indexOf('イベントID'),
    title:       header.indexOf('イベント名'),
    date:        header.indexOf('イベント予定日'),
    startTime:   header.indexOf('開始時刻'),
    endTime:     header.indexOf('終了時刻'),
    attendees:   header.indexOf('出席者'),
    description: header.indexOf('イベント詳細'),
    status:      header.indexOf('登録ステータス'),
  }
 
  console.log(column);
  return column
}


/**
 * Google Meet付きで予定を登録し、Meet URLを返す
 * 
 * @param  {Object.<string>} object - 予定、日時、詳細などの情報
 * @return {string} 
 * 
 */
function createEventWithMeetUrl_(object) {
  //GoogleカレンダーでMeet会議が設定されるイベント登録パラメータを設定
  const eventParam = {
    conferenceData: {
      createRequest: {
        conferenceSolutionKey: {
          type: "hangoutsMeet"
        },
        requestId: "123"
      }
    },
    summary: object.title,//カレンダータイトル
    description: object.description,
    start:     {dateTime: object.startTime},
    end:       {dateTime: object.endTime},
    attendees: object.attendees,
  };
 
  //CalendarAPIに対し、Meet会議付き予定を追加
  const event = Calendar.Events.insert(eventParam, object.calId, {conferenceDataVersion: 1});
  console.log('登録成功');
  console.log(`イベントID：${event.id}`);
 
  return event.id
 
}


/**
 * 'attendees': [{'email': 'lpage@example.com'},{'email': 'sbrin@example.com'}],
 * registerEventsWithMeetUrl_()内で、上記のように指定すると出席者を登録する事が出来る
 *
 * @param  {string} string - 'aiueo@sample.com, abc@sample.com'
 * @return {Array.<Object.<string>}
 */

function generateAttendees_(string){
  const newArray = string.split(',').map(email => ({'email': email}));
  console.log(newArray);
  return newArray
}



/**
 * 
 * 予定を削除する、削除前にはアラートが表示される
 * 
 * @param {string} query - 削除したい予定のタイトル　省略可。省略した場合はプロンプトに入力する
 * @param {string} calId - カレンダーID  省略可。　省略した場合は、自分のアカウントで処理が実施される。
 * 
 */
function deleteEvents(query, calId){

  if(!query) query = showPrompt('削除したい予定名を入力してください', '（例）：テスト');

  const cal       = calId ? CalendarApp.getCalendarById(calId) : CalendarApp.getDefaultCalendar();
  const startDate = new Date();
  const endDate   = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  let string = '';
  let count  = 0;

  const eventIdArray = cal.getEvents(startDate, endDate)
  .filter(event => event.getTitle().includes(query)) // queryを含むイベントのみをフィルタリング
  .map(event => {
    const info = {
      eventId:    event.getId(),
      targetDate: formatDate(event.getStartTime(), 'yyyy/MM/dd (E) HH:mm'),
      targetDay:  convertDay(event.getStartTime().getDay())
    };

    count  += 1;
    string += `${count}. ${event.getTitle()} ${info.targetDate}\n`;
    return info.eventId
  
  });

  console.log(string);
  console.log(`該当する予定が${count}件あります。`);
  console.log(eventIdArray);

  const ui       = SpreadsheetApp.getUi();
  const response = ui.alert(`${query}　を含む予定が${count}件あります。\n
    削除してもよろしいですか？\n\n
    ${string}`, ui.ButtonSet.YES_NO
  );

  switch (response){
    case ui.Button.YES:
      console.log('“はい” のボタンが押されました。');
      eventIdArray.map(eventId => CalendarApp.getEventById(eventId).deleteEvent());
      ui.alert('予定の削除が完了しました。');
      break;

    case ui.Button.NO:
      console.log('“いいえ” のボタンが押されました。');
      ui.alert('処理が中断されました。');
      break;

    default:
      console.log('処理が中断されました。');
      return
  }
}



/**
 * 
 * 予定を編集するスクリプトを起動する画面を表示する
 * 
 */
function showEditEventsLauncher() {
  const html = HtmlService.createHtmlOutputFromFile('choice');
  SpreadsheetApp.getUi().showModalDialog(html, 'どのように編集したいかを選択してください');
  //choice.htmlでGoogle.script.runが動くはず
  //返り値などは必要ない
}


/**
 * choice.htmlで選択した内容を受け取って、編集内容を分岐させる
 * @param  {Object.<string>} object - 選択肢の内容 
 *
 * 
 */
function editEvents(object){
  const argument = String(Object.values(object));
  console.log(`argument: ${argument} typeOf ${typeof argument}`);

  const calId = showPrompt('カレンダーIDを入力してください', '空白の場合は自分のカレンダーを処理対象とします');
  console.log(`カレンダーID：　${calId}`);

  let cal;

  if(calId){
    cal = CalendarApp.getCalendarById(calId);
    console.log(`処理対象のアカウント：　${cal.getName()}`);

  }else {
    cal = CalendarApp.getDefaultCalendar();
    console.log(`処理対象のアカウント：　${cal.getName()}`);

  }
  
  //シート上を走査して、編集対象のイベントIDを取得する
  const sheet  = SpreadsheetApp.getActiveSheet();
  const values = sheet.getDataRange().getValues();
  const header = values[0];
  const column = {
    eventId:     header.indexOf('イベントID'),
    title:       header.indexOf('イベント名'),
    date:        header.indexOf('イベント予定日'),
    startTime:   header.indexOf('開始時刻'),
    endTime:     header.indexOf('終了時刻'),
    attendees:   header.indexOf('出席者'),
    description: header.indexOf('イベント詳細'),
    status:      header.indexOf('登録ステータス')
  }

  let count = 0;

  for(let i = 0; i < values.length; i++){
    if(values[i][column.status] === '編集対象'){

      const event = cal.getEventById(values[i][column.eventId]);
      console.log(`予定名：${event.getTitle()}`);

      switch(argument){
        case '予定名を編集する':
          event.setTitle(values[i][column.title]);
          break;
        case '詳細欄を編集する':
          event.setDescription(values[i][column.description]);
          break;
        case '日時を編集する':
          const startTime = new Date(values[i][column.date]);
          startTime.setHours(values[i][column.startTime].getHours());
          startTime.setMinutes(values[i][column.startTime].getMinutes());

          const endTime = new Date(startTime);
          endTime.setHours(values[i][column.endTime].getHours());
          endTime.setMinutes(values[i][column.endTime].getMinutes());

          event.setTime(startTime, endTime);
          break;
        case '出席者を追加する':
          const guests = values[i][column.attendees].split(',');
          console.log(guests);

          guests.map(guest => event.addGuest(guest));
          break;
        default:
          console.log('該当しませんでした');
      }

      const row = i + 1;
      console.log(`処理対象行：　${row}`);

      sheet.getRange(row, column.status + 1).setValue('編集済');
      count += 1;

    }else {
      continue;
    }
  }
  SpreadsheetApp.getUi().alert(`${count}件の予定を変更しました`);
}


/**
 * @param  {string} eventId - イベントID、UI操作だと確認不可
 * @param  {string} calId - 予定の登録先、通常はメールアドレスなど
 * @return {Object.<string>}　予定の詳細
 * 
 */
function getInfoByEventId(eventId, calId){
  let cal;
  if(calId){
    cal = CalendarApp.getCalendarById(calId);

  }else{
    cal = CalendarApp.getDefaultCalendar();

  }

  console.info(`getInfoByEventId()を実行中`);
  console.info(`02_calenderに記載`);

  const event = cal.getEventById(eventId);
  const info  = {
    eventTitle:  event.getTitle(),
    targetDate:  formatDate(event.getStartTime(), 'yyyy/MM/dd'),
    targetDay:   convertDay(event.getStartTime().getDay()),
    startTime:   formatDate(event.getStartTime(), 'HH:mm'),
    endTime:     formatDate(event.getEndTime(), 'HH:mm'),
    eventDetail: event.getDescription()
  }

  console.log(info);
  return info;
}