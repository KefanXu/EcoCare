/**
 * Chinese for the study case: Jordan, the care-ecology entities and flows,
 * and the three life-changing events. Standard text keeps clinical terms;
 * Easy text keeps the everyday wording of the English Easy copy.
 */
export const ZH_CASE: Record<string, string> = {
  // ---- Patient ----
  Jordan: '乔丹',
  'Type 2 Diabetes + Diabetic Foot Ulcer': '2 型糖尿病 + 糖尿病足溃疡',
  'Jordan has been managing Type 2 Diabetes for 9 years and developed a diabetic foot ulcer 6 months ago. They work a standing retail job, live with their partner who is the primary informal caregiver, and see a primary-care clinician, podiatrist, and diabetes educator regularly.':
    '乔丹患 2 型糖尿病已有 9 年，6 个月前又出现了糖尿病足溃疡。乔丹在零售店工作，需要长时间站立；与伴侣同住，伴侣是主要的家庭照护者。乔丹定期去看全科医生、足病医生和糖尿病教育师。',

  // ---- Entities: individual ----
  'A 52-year-old living with Type 2 Diabetes for 9 years and a diabetic foot ulcer for 6 months. Works full-time; lives with their partner.':
    '52 岁，患 2 型糖尿病 9 年，患糖尿病足溃疡 6 个月。全职工作，与伴侣同住。',
  'This is Jordan. Jordan has diabetes and a sore foot, and this whole map is about the people and things that help Jordan stay healthy.':
    '这是乔丹。乔丹有糖尿病，脚上还有一处伤口。这张图里画的，都是帮助乔丹保持健康的人和事物。',
  'Continuous Glucose Monitor': '连续血糖监测仪',
  'A wearable CGM (Dexcom G7) that streams glucose readings to their phone and triggers alarms below 100 mg/dL.':
    '一种可穿戴的连续血糖监测仪（Dexcom G7），把血糖读数实时传到手机上，血糖低于 100 mg/dL 时会发出警报。',
  'Sugar Sensor': '血糖传感器',
  'A little sensor Jordan wears that checks blood sugar all day and sends the numbers to a phone.':
    '乔丹身上戴的一个小传感器，全天检测血糖，并把数值发送到手机上。',
  'Insulin Pen': '胰岛素笔',
  'A pre-filled insulin pen used to dose mealtime insulin. Replaced finger-prick + vial workflow.':
    '预充式胰岛素笔，用来注射餐前胰岛素，取代了以前扎手指测血糖、再从药瓶里抽药的做法。',
  'The pen Jordan uses to take insulin medicine before meals.': '乔丹饭前用来注射胰岛素的笔。',
  'Foot Dressings & Pads': '足部敷料和护垫',
  'Wound care supplies for the diabetic foot ulcer; replaced daily.': '用于护理糖尿病足溃疡的伤口用品，每天更换。',
  'Foot Bandages': '脚部绷带',
  'Clean bandages that protect the sore on Jordan’s foot. They get changed every day.':
    '保护乔丹脚上伤口的干净绷带，每天都要换。',
  'Medication Routine': '日常用药安排',
  'Take metformin with breakfast and dinner; bolus insulin before each meal; align timing with family meals.':
    '早餐和晚餐时服用二甲双胍；每餐前注射胰岛素；用药时间跟家里吃饭的时间对齐。',
  'Medicine Routine': '每日用药',
  'Taking the right medicine at the right times every day, usually with meals.': '每天按时、按量吃药，一般是跟着吃饭的时间。',
  'Foot Care Routine': '日常足部护理',
  'Daily wound cleaning, redressing, and skin inspection. Wears wide-toe shoes.': '每天清洁伤口、更换敷料并检查皮肤。穿宽头鞋。',
  'Cleaning the foot sore, putting on a fresh bandage, and checking the skin every day.':
    '每天清洗脚上的伤口、换上新绷带，并检查皮肤。',
  'Glucose Readings': '血糖读数',
  'Continuous time-series data from the CGM, synced to their phone.': '血糖监测仪连续记录的数据，会同步到手机上。',
  'Sugar Numbers': '血糖数值',
  'The numbers from the sugar sensor that tell Jordan if blood sugar is high or low.':
    '血糖传感器测出的数值，告诉乔丹血糖是高还是低。',

  // ---- Entities: microsystem ----
  'Partner (Caregiver)': '伴侣（照护者）',
  'Primary informal caregiver. Helps wrap and clean the foot ulcer; verifies clinic instructions.':
    '主要的家庭照护者。帮忙清洗和包扎足部溃疡，并核对诊所的医嘱。',
  Partner: '伴侣',
  'Jordan’s partner, who helps clean and wrap the foot sore every evening.': '乔丹的伴侣，每天晚上帮忙清洗和包扎脚上的伤口。',
  'Adult Daughter': '成年女儿',
  'Lives nearby; researches diabetes care online and shares findings with Jordan.': '住在附近；在网上查找糖尿病护理资料，并分享给乔丹。',
  Daughter: '女儿',
  'Jordan’s daughter, who lives close by and shares helpful tips she finds.': '乔丹的女儿，住得很近，看到有用的建议会分享给乔丹。',
  'Family Meal Schedule': '家庭用餐时间表',
  'Shared breakfast and dinner at fixed times; dietary planning is a family project.':
    '全家在固定时间一起吃早餐和晚餐；吃什么由全家一起商量。',
  'Family Meals': '家庭用餐',
  'The family eats breakfast and dinner together, and Jordan takes medicine with those meals.':
    '全家一起吃早餐和晚餐，乔丹也是在这两顿饭时用药。',
  'Home Pantry & Diet': '家中食品与饮食',
  'Low-glycemic groceries managed by Jordan and their partner; constrained by budget.': '乔丹和伴侣采购的低升糖食物，受家庭预算限制。',
  'Food at Home': '家里的食物',
  'The healthy food Jordan and their partner keep at home to cook with.': '乔丹和伴侣在家里备着做饭用的健康食材。',
  'Work Schedule': '工作时间安排',
  'Standing retail job, 30-minute lunch and two 15-minute breaks. Closed-toe-shoe policy.':
    '零售工作，需要长时间站立；午休 30 分钟，另有两次 15 分钟的休息。公司规定必须穿包头鞋。',
  'Work Hours': '工作时间',
  'Jordan’s job hours and short breaks, which decide when Jordan can eat and take medicine.':
    '乔丹的上班时间和短暂的休息时间，决定了乔丹什么时候能吃饭和用药。',
  'Caregiver Notes': '照护记录',
  'Partner-maintained notes on dressing changes, blood pressure, and questions for the clinic.':
    '伴侣记下的换药情况、血压，以及要问诊所的问题。',
  'Care Notes': '护理笔记',
  'Notes the partner writes about how Jordan is doing, to show the doctors later.': '伴侣记下的乔丹每天的情况，看病时拿给医生看。',

  // ---- Entities: mesosystem ----
  'Primary Care Clinician': '全科医生',
  'Manages diabetes treatment plan, prescribes metformin and insulin, refers to specialists.':
    '负责糖尿病的整体治疗，开二甲双胍和胰岛素，需要时转诊给专科医生。',
  'Main Doctor': '主治医生',
  'Jordan’s main doctor, who decides the medicines and keeps an eye on everything.': '乔丹的主治医生，负责开药，也关注乔丹的整体情况。',
  Podiatrist: '足病医生',
  'Treats the diabetic foot ulcer; recommends offloading pads and footwear.': '治疗糖尿病足溃疡；建议使用减压垫和合适的鞋。',
  'Foot Doctor': '足科医生',
  'The doctor who takes care of the sore on Jordan’s foot.': '负责治疗乔丹脚上伤口的医生。',
  'Diabetes Educator': '糖尿病教育师',
  'Coaches insulin technique, glucose interpretation, and lifestyle adjustments.': '指导胰岛素注射技巧、血糖解读和生活方式调整。',
  'Diabetes Coach': '糖尿病指导师',
  'A coach who teaches Jordan how to use insulin and understand the sugar numbers.': '教乔丹怎么打胰岛素、怎么看懂血糖数值的指导师。',
  'Local Pharmacy': '本地药房',
  'Dispenses prescriptions; runs medication-reminder texts and insurance prior-auth checks.':
    '按处方配药；发送用药提醒短信，并帮忙办理保险的预先授权。',
  Pharmacy: '药房',
  'The store where Jordan picks up medicine and bandages.': '乔丹取药和买绷带的地方。',
  'Clinic Visits': '门诊就诊',
  'Quarterly primary-care visits and bi-weekly podiatry visits where the care plan is iterated.':
    '每季度看一次全科门诊，每两周看一次足病门诊，护理计划在每次就诊时调整。',
  'Doctor Visits': '看医生',
  'Going to see the doctors for checkups, where the care plan gets updated.': '去找医生做检查，护理计划也会在这时更新。',
  'Treatment Plan': '治疗计划',
  'Shared, evolving plan covering medication, foot-care protocol, and target A1C.':
    '共享且不断更新的计划，涵盖用药、足部护理方案和糖化血红蛋白（A1C）目标。',
  'Care Plan': '护理计划',
  'The plan the doctors write that says which medicines to take and how to care for the foot.':
    '医生定下的计划，写明要用哪些药、脚该怎么护理。',

  // ---- Entities: exosystem ----
  'Employer Footwear Policy': '公司的穿鞋规定',
  'Closed-toe-shoe rule at work; managers can grant medical accommodation but rarely do.':
    '上班必须穿包头鞋；经理可以因病例外批准，但很少这样做。',
  'Work Shoe Rules': '上班穿鞋的规定',
  'Rules at Jordan’s job about what shoes to wear — they make the sore foot harder to protect.':
    '乔丹公司对上班穿什么鞋有规定，这让受伤的脚更难得到保护。',
  'Health Insurance': '医疗保险',
  'Employer-sponsored plan that determines drug formulary and specialist coverage.':
    '公司提供的医疗保险，决定哪些药品能报销、看专科能报多少。',
  Insurance: '保险',
  'The company that helps pay for Jordan’s medicine and doctor visits.': '帮乔丹支付药费和看病费用的保险公司。',
  'EMR / Patient Portal': '电子病历 / 患者门户',
  'Electronic medical record shared across their clinicians; they view labs and messages providers.':
    '各位医生共用的电子病历；乔丹可以在上面看化验结果，也能给医护人员留言。',
  'Health Records App': '健康档案 App',
  'The app where the doctors and Jordan can see test results and send messages.': '医生和乔丹都能看检查结果、互相留言的手机 App。',
  'Transportation Access': '交通出行',
  'A 30-minute bus ride is the only path to their primary clinic.': '去全科诊所只能坐 30 分钟的公交车。',
  'Rides to the Doctor': '看病的交通',
  'The bus Jordan takes to get to the doctor. Without it, visits are hard.': '乔丹去看病要坐公交车。没有公交，看病就很难。',

  // ---- Entities: macrosystem ----
  'ADA Care Guidelines': 'ADA 诊疗指南',
  'American Diabetes Association guidelines that shape clinical decisions.': '美国糖尿病协会（ADA）发布的指南，影响临床决策。',
  'Care Rulebook': '诊疗规范',
  'Expert rules that tell doctors the best way to treat diabetes.': '专家制定的规范，告诉医生怎样治疗糖尿病最好。',
  'Healthcare System': '医疗卫生体系',
  'Regional hospital network, billing system, and referral norms that their clinics operate within.':
    '当地的医院网络、收费制度和转诊惯例，乔丹看病的诊所都要按这些运作。',
  'Hospitals & Clinics': '医院和诊所',
  'All the hospitals and clinics in the area, and the rules they work by.': '当地所有的医院和诊所，以及它们遵循的规则。',
  'Cultural & Family Norms': '文化与家庭观念',
  'Expectations around food, work, and caregiving that shape daily management decisions.':
    '人们对饮食、工作和照顾家人的看法，会影响日常病情管理的选择。',
  'Family Traditions': '家庭传统',
  'The family’s habits around food, work, and helping each other.': '家里在饮食、工作和互相帮助方面的习惯。',

  // ---- Flows (verb label · content · description) ----
  'streams readings': '实时传送读数',
  'Glucose values & trends': '血糖值和趋势',
  'CGM continuously generates glucose values that the patient interprets.': '血糖监测仪不断测出血糖值，由乔丹自己判断高低。',
  'informs decisions': '帮助做决定',
  'Current glucose level & low alerts': '当前血糖水平和低血糖警报',
  'Jordan checks their phone for current glucose before eating, exercising, or dosing.':
    '乔丹在吃饭、运动或打胰岛素之前，会先看看手机上的血糖。',
  follows: '按照执行',
  'Self-adjusted dosing decisions': '自己调整用量',
  'They adjust insulin dosing and timing based on glucose readings and meals.': '乔丹根据血糖和吃饭情况，调整胰岛素的用量和时间。',
  performs: '执行',
  'Wound observations & cleaning actions': '观察伤口并清洁',
  'Daily wound cleaning and inspection.': '每天清洁和检查伤口。',
  uses: '使用',
  'Insulin dose & timing': '胰岛素剂量和时间',
  'Insulin pen is the tool used to act on the medication routine.': '按用药安排打胰岛素，靠的就是这支笔。',
  consumes: '消耗',
  'Daily dressing supplies': '每天要用的敷料',
  'Routine consumes wound-care supplies daily.': '每天护理都要用掉一些伤口护理用品。',
  'assists wound care': '协助伤口护理',
  'Hands-on wound care assistance': '动手帮忙护理伤口',
  'Partner wraps and inspects the foot ulcer with Jordan each evening.': '伴侣每天晚上和乔丹一起检查并包扎足部溃疡。',
  records: '记录',
  'Dressing log, BP & clinic questions': '换药记录、血压和要问诊所的问题',
  'Partner logs dressing changes, BP, and questions for the next clinic visit.': '伴侣记下换药情况、血压，以及下次看病时要问的问题。',
  'shares research': '分享查到的资料',
  'Diabetes articles & lifestyle tips': '糖尿病文章和生活小建议',
  'Daughter forwards diabetes articles and discusses them with Jordan.': '女儿转发糖尿病相关的文章，并和乔丹一起讨论。',
  'anchors timing': '决定用药时间',
  'Shared meal timing': '全家吃饭的时间',
  'Insulin and metformin are taken with shared family meals.': '胰岛素和二甲双胍都是在全家吃饭时用。',
  stocks: '提供食材',
  'Low-glycemic ingredients': '低升糖食材',
  'Low-glycemic pantry shapes what the family cooks together.': '家里备的低升糖食材，决定了全家做什么饭。',
  constrains: '限制',
  'Break-window constraints on dosing': '休息时间限制了用药',
  'Short breaks at work limit when Jordan can dose or eat.': '上班时休息时间短，乔丹什么时候能打针、吃饭都受限制。',
  authors: '制定',
  'Medication prescriptions & target A1C': '用药处方和 A1C 目标',
  'Primary clinician sets and updates the treatment plan.': '全科医生制定并更新治疗计划。',
  'updates foot care': '更新足部护理方案',
  'Foot-ulcer protocol & footwear orders': '足部溃疡护理方案和穿鞋医嘱',
  'Podiatrist contributes the foot-ulcer protocol.': '足病医生负责制定足部溃疡的护理方案。',
  coaches: '指导',
  'Insulin technique & glucose interpretation': '胰岛素注射技巧和血糖解读',
  'Educator coaches Jordan on insulin technique and glucose interpretation.': '糖尿病教育师教乔丹怎么打胰岛素、怎么看血糖。',
  prescribes: '规定',
  'Dosing schedule & target A1C': '用药时间表和 A1C 目标',
  'Plan dictates dosing, frequency, and target A1C.': '计划规定了用药剂量、次数和 A1C 目标。',
  specifies: '规定',
  'Wound cleaning protocol & footwear': '伤口清洁方法和穿鞋要求',
  'Plan defines wound cleaning protocol and footwear.': '计划规定了伤口怎么清洁、该穿什么鞋。',
  dispenses: '配发',
  'Insulin prescription fill': '按处方给胰岛素',
  'Pharmacy fills monthly insulin prescription.': '药房每月按处方给乔丹配胰岛素。',
  'Wound-care supply orders': '伤口护理用品',
  'Wound-care supplies sourced via pharmacy.': '伤口护理用品都从药房买。',
  iterates: '调整',
  'Visit outcomes & plan revisions': '就诊结果和计划调整',
  'Visits update the plan based on outcomes.': '每次看病后，都会根据情况调整计划。',
  attends: '去看病',
  'Self-tracked glucose & questions': '自己记录的血糖数据和问题',
  'Jordan brings questions and self-tracked data to each visit.': '乔丹每次看病都会带上问题和自己记录的数据。',
  briefs: '提供情况',
  'At-home observations & vitals log': '在家的观察和血压等记录',
  'Partner notes provide context the clinician would otherwise miss.': '伴侣的记录能让医生了解到平时看不到的情况。',
  'shares trends': '分享趋势',
  'CGM trends shared via portal': '通过患者门户分享的血糖趋势',
  'CGM trends shared via the patient portal between visits.': '两次看病之间，血糖趋势通过患者门户发给医生。',
  'Labs, notes & imaging': '化验结果、病历记录和影像资料',
  'EMR holds labs, notes, and imaging for the clinician.': '电子病历里保存着化验结果、病历和影像资料，供医生查看。',
  'Wound progress documentation': '伤口愈合进展记录',
  'Podiatrist documents wound progress in the same EMR.': '足病医生也在同一份电子病历里记录伤口的恢复情况。',
  'gates coverage': '决定报销',
  'Formulary & prior-auth decisions': '报销目录和预先授权的结果',
  'Insurance formulary determines which drugs and devices are affordable.': '保险报销目录决定了哪些药品和器械用得起。',
  shapes: '影响',
  'Footwear & break-time policy': '穿鞋和休息时间的规定',
  'Footwear and break policy constrain Jordan during the workday.': '穿鞋和休息的规定，让乔丹上班时处处受限。',
  enables: '方便出行',
  'Bus route access': '公交线路',
  'Bus access determines whether visits are realistic.': '有没有公交，决定了乔丹能不能去看病。',
  guides: '指导',
  'Clinical practice guidelines': '临床实践指南',
  'ADA guidelines shape clinical decisions.': 'ADA 指南影响临床决策。',
  structures: '规范',
  'Coverage norms & billing rules': '报销惯例和收费规则',
  'System-level rules govern coverage norms.': '整个医疗体系的规则决定了报销的惯例。',
  'Food traditions & dietary expectations': '饮食传统和吃饭的习惯',
  'Cultural food traditions influence the family table.': '传统的饮食文化影响着家里饭桌上吃什么。',
  pressures: '施加压力',
  'Workplace presenteeism pressure': '生病也得上班的压力',
  'Norms about staying employed despite illness.': '“生病也不能丢了工作”的观念。',

  // ---- Baseline conflict ----
  'Closed-toe shoes vs. foot ulcer': '包头鞋与足部溃疡的矛盾',
  'Jordan needs wide, open footwear for the ulcer, but the employer policy requires closed-toe shoes — a cross-layer conflict between the exosystem and the individual layer.':
    '乔丹的溃疡需要穿宽松、不包脚的鞋，但公司规定必须穿包头鞋。这是外层系统和个人层之间的跨层冲突。',

  // ---- Event 1: insurance ----
  'Insurance Drops Insulin Coverage': '保险不再报销胰岛素',
  "Jordan's employer-sponsored insurance switched formularies. Their current insulin pen is no longer covered, and the alternative requires a prior authorization that may take weeks.":
    '乔丹的公司医保换了药品报销目录。乔丹现在用的胰岛素笔不能再报销，而可以报销的替代药需要先申请预先授权，可能要等好几周。',
  'Insurance stops covering the insulin pen': '保险不再报销胰岛素笔',
  'Jordan’s insurance stopped paying for the insulin pen Jordan uses every day. A different insulin is covered, but it needs special approval first, and that can take weeks.':
    '乔丹每天用的胰岛素笔，保险不再报销了。另一种胰岛素可以报销，但要先经过特别批准，可能要等好几周。',
  'No covered insulin': '没有可报销的胰岛素',
  'The covered drug pathway is severed: pharmacy cannot dispense the current pen, breaking the medication routine and triggering plan revision.':
    '能报销的用药渠道断了：药房给不了现在用的胰岛素笔，用药安排被打乱，治疗计划也得跟着改。',
  'The new formulary no longer covers the current insulin pen; coverage now hinges on a prior authorization that may take weeks.':
    '新的报销目录不再包括现在用的胰岛素笔；能不能报销要看预先授权，可能要等好几周。',
  'The insurance company stopped paying for the insulin pen.': '保险公司不再报销胰岛素笔了。',
  'Out-of-pocket cost makes the pen hard to obtain, so supply becomes unreliable until an alternative is approved.':
    '自费太贵，胰岛素笔很难买到；在替代药批下来之前，供药没有保障。',
  'The pen costs too much now, so it is hard to get.': '现在这支笔太贵了，很难买到。',
  'Daily dosing depends on a steady insulin supply; gaps or a switch to a different pen disrupt the established routine.':
    '每天用药离不开稳定的胰岛素供应；一旦断药或换成别的胰岛素笔，原来的用药安排就会被打乱。',
  'Taking medicine every day gets harder without the pen.': '没有这支笔，每天按时用药就更难了。',
  'The pharmacy cannot dispense the current pen under the new plan and must wait on the prior authorization.':
    '按新的保险规定，药房不能给现在用的胰岛素笔，只能等预先授权批下来。',
  'The pharmacy cannot hand out the pen like before.': '药房不能像以前那样给这支笔了。',
  'The plan assumes the current insulin; the care team must revise dosing and product while coverage is sorted out.':
    '治疗计划是按现在用的胰岛素定的；在报销问题解决之前，医护团队需要调整用药和剂量。',
  'The care plan has to change to a different medicine.': '护理计划需要改用另一种药。',

  // ---- Event 2: relocation ----
  'Relocation Away From Family': '搬家，远离家人',
  "Jordan and their partner move two hours away for their partner's job. Their daughter, primary-care clinician, podiatrist, and pharmacy are all left behind.":
    '因为伴侣换了工作，乔丹和伴侣搬到了两小时车程外的地方。女儿、全科医生、足病医生和常去的药房都留在了原来的地方。',
  'Moving two hours away from family': '搬到离家人两小时车程的地方',
  'Jordan and their partner moved two hours away for the partner’s job. Jordan’s daughter, main doctor, foot doctor, and pharmacy are all back in the old town.':
    '因为伴侣换了工作，乔丹和伴侣搬到了两小时车程外的地方。乔丹的女儿、主治医生、足科医生和常去的药房，都还在原来的地方。',
  'Lost continuity of care': '照护连续性中断',
  'Established clinical relationships are severed. The treatment plan loses its authors and the iteration loop stops.':
    '原来的医患关系断了。没有医生继续负责治疗计划，计划也就没法根据情况调整了。',
  'Thinner microsystem': '微观系统变得薄弱',
  'Daughter is no longer nearby; the partner shoulders more caregiving alone, putting pressure on foot care and information processing.':
    '女儿不在身边了，伴侣要一个人承担更多照护，足部护理和整理各种信息的压力都变大了。',
  'Now two hours away, the daughter can no longer drop in; everyday check-ins and hands-on help are lost.':
    '女儿现在离得有两小时车程，没法随时过来，平时的探望和搭把手都没有了。',
  'The daughter lives far away now and cannot stop by to help.': '女儿现在住得很远，没法过来帮忙。',
  'The established primary-care relationship is left behind; a new clinician must be found and brought up to speed.':
    '原来的全科医生离得太远了；需要找一位新医生，并让他尽快了解乔丹的情况。',
  'The main doctor is far away now. Jordan needs a new one.': '主治医生现在离得很远，乔丹需要找一位新的医生。',
  'Ongoing foot-ulcer follow-up is interrupted until a new podiatrist is found and records are transferred.':
    '足部溃疡的复诊中断了，要等找到新的足病医生、转好病历之后才能继续。',
  'The foot doctor is far away now, so foot checkups stop.': '足科医生现在离得太远，脚的复查只好停了。',
  'The pharmacy that filled insulin and dressings is out of reach; refills must be re-established elsewhere.':
    '原来配胰岛素和敷料的药房太远了，需要在新地方重新找药房续药。',
  'The old pharmacy is too far away to pick up medicine.': '原来的药房太远了，没法去拿药。',
  'Familiar routes and rides no longer apply; getting to any clinic now requires new arrangements.':
    '熟悉的路线和交通方式都用不上了，现在去哪家诊所都得重新安排。',
  'The usual rides to the clinic do not work in the new town.': '到了新地方，以前去诊所的交通方式都用不上了。',
  'Scheduled visits with the old care team lapse, breaking the feedback loop that updates the treatment plan.':
    '和原来医护团队约好的复诊都中断了，治疗计划也就没法根据复诊情况更新。',
  'The regular doctor visits stop until new ones are set up.': '定期看医生暂停了，要等约好新的医生才能继续。',

  // ---- Event 3: partner surgery ----
  'Partner Has Hand Surgery': '伴侣做手部手术',
  "Jordan's partner needs hand surgery and a 6-week recovery, and can no longer help wrap their foot ulcer or maintain caregiver notes.":
    '乔丹的伴侣要做手部手术，术后需要休养 6 周，这段时间没法帮乔丹包扎足部溃疡，也没法记照护记录。',
  'Partner needs hand surgery': '伴侣需要做手部手术',
  'Jordan’s partner needs hand surgery and six weeks to recover. During that time the partner cannot help wrap Jordan’s foot sore or keep the care notes.':
    '乔丹的伴侣要做手部手术，需要休养六周。这段时间里，伴侣没法帮乔丹包扎脚上的伤口，也没法记护理笔记。',
  'Wound care without dyadic support': '没有伴侣帮忙的伤口护理',
  'Jordan must perform wound care alone, increasing time, cognitive load, and risk of infection.':
    '乔丹只能自己护理伤口，更费时间、更费心思，感染的风险也更高。',
  'Information work falls back on Jordan': '记录的事又落到乔丹身上',
  'Without partner-maintained notes, the clinic loses its richest between-visit context.':
    '没有伴侣的记录，诊所就看不到两次看病之间最详细的情况了。',
  'Recovering from hand surgery for about six weeks, the partner cannot wrap the foot ulcer or keep up the caregiver notes.':
    '伴侣做完手部手术要休养六周左右，这段时间没法包扎足部溃疡，也没法继续记照护记录。',
  'The partner hurt their hand and cannot help with care for six weeks.': '伴侣的手做了手术，六周内没法帮忙照护。',
  'No one is maintaining the between-visit notes, so the clinic loses its richest day-to-day context.':
    '没人记录两次看病之间的情况，诊所也就看不到最详细的日常信息了。',
  'Nobody is writing the care notes right now.': '现在没有人记护理笔记了。',
  'Jordan must do wound care alone, which adds time, cognitive load, and infection risk.':
    '乔丹只能自己护理伤口，更费时间、更费心思，感染的风险也更高。',
  'Jordan has to do the foot bandages alone now.': '现在乔丹只能自己包扎脚上的伤口。',
};
