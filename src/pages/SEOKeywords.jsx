import { Link } from 'react-router-dom';
import './SEOKeywords.css';

function SEOKeywords() {
  return (
    <div className="seo-keywords-page">
      <div className="seo-content">
        <h1>Roadex – أفضل شركة تأجير سيارات في مصر</h1>
        <h1>Roadex – The Best Car Rental Company in Egypt</h1>

        <div className="seo-bilingual-section">
          <div className="seo-arabic">
            <h2>خدمات تأجير السيارات في جميع محافظات مصر</h2>
            <p>
              <strong>Roadex</strong> هي الوجهة المثالية لكل من يبحث عن <strong>سيارة للإيجار في مصر</strong>، سواء كنت بحاجة إلى <strong>سيارة مع سائق</strong> أو تفضل القيادة بنفسك. نوفر لك تشكيلة واسعة من السيارات الفاخرة والاقتصادية التي تناسب جميع الاحتياجات والميزانيات.
            </p>

            <p>
              تغطي خدماتنا جميع محافظات مصر الـ 27، من القاهرة والإسكندرية إلى الأقصر وأسوان والغردقة وشرم الشيخ. سواء كنت في رحلة عمل أو سياحة، نوفر لك أفضل وسائل النقل لتنقلاتك اليومية ورحلاتك السياحية.
            </p>

            <h3>محافظات مصر – Egyptian Governorates</h3>
            
            <div className="governorates-grid">
              <div className="gov-card">
                <h4>القاهرة</h4>
                <p>تأجير سيارات في القاهرة مع سائق أو بدون. خدمة مطار القاهرة الدولي، جولات سياحية في الأهرامات والمتحف المصري.</p>
                <p className="en-text">Car rental in Cairo with or without driver. Cairo International Airport service.</p>
              </div>
              <div className="gov-card">
                <h4>الإسكندرية</h4>
                <p>سيارات للإيجار في الإسكندرية مع سائق. جولات على الكورنيش، مكتبة الإسكندرية وقلعة قايتباي.</p>
                <p className="en-text">Car rental in Alexandria with driver. Corniche tours, Library of Alexandria.</p>
              </div>
              <div className="gov-card">
                <h4>الغردقة / البحر الأحمر</h4>
                <p>تأجير سيارات في الغردقة مع سائق للجولات السياحية والشاطئية. مطار الغردقة الدولي.</p>
                <p className="en-text">Car rental in Hurghada with driver. Red Sea tours, Hurghada Airport.</p>
              </div>
              <div className="gov-card">
                <h4>شرم الشيخ / جنوب سيناء</h4>
                <p>سيارات للإيجار في شرم الشيخ مع سائق. جولات سياحية، رحلات صحراوية، مطار شرم الشيخ.</p>
                <p className="en-text">Car rental in Sharm El-Sheikh with driver. Desert safaris, Sharm Airport.</p>
              </div>
              <div className="gov-card">
                <h4>الأقصر</h4>
                <p>تأجير سيارات في الأقصر مع سائق لزيارة المعابد والمقابر الفرعونية. البر الغربي والشرقي.</p>
                <p className="en-text">Car rental in Luxor with driver. Temples, Valley of the Kings.</p>
              </div>
              <div className="gov-card">
                <h4>أسوان</h4>
                <p>سيارات للإيجار في أسوان مع سائق. معبد أبو سمبل، السد العالي، الجزيرة النباتية.</p>
                <p className="en-text">Car rental in Aswan with driver. Abu Simbel, High Dam, Botanical Garden.</p>
              </div>
              <div className="gov-card">
                <h4>بورسعيد</h4>
                <p>تأجير سيارات في بورسعيد مع سائق أو بدون. ميناء بورسعيد، كورنيش البحر.</p>
                <p className="en-text">Car rental in Port Said with or without driver. Port Said port.</p>
              </div>
              <div className="gov-card">
                <h4>السويس</h4>
                <p>سيارات للإيجار في السويس مع سائق. ميناء السويس، العين السخنة.</p>
                <p className="en-text">Car rental in Suez with driver. Suez port, Ain Sokhna.</p>
              </div>
              <div className="gov-card">
                <h4>المنصورة / الدقهلية</h4>
                <p>تأجير سيارات في المنصورة مع سائق. تنقلات يومية، جولات سياحية.</p>
                <p className="en-text">Car rental in Mansoura with driver. Daily transportation.</p>
              </div>
              <div className="gov-card">
                <h4>طنطا / الغربية</h4>
                <p>سيارات للإيجار في طنطا مع سائق. تنقلات يومية، رحلات للمحافظات المجاورة.</p>
                <p className="en-text">Car rental in Tanta with driver. Daily transportation.</p>
              </div>
              <div className="gov-card">
                <h4>الزقازيق / الشرقية</h4>
                <p>تأجير سيارات في الزقازيق مع سائق. تنقلات يومية، جولات سياحية.</p>
                <p className="en-text">Car rental in Zagazig with driver. Daily transportation.</p>
              </div>
              <div className="gov-card">
                <h4>الإسماعيلية</h4>
                <p>سيارات للإيجار في الإسماعيلية مع سائق. قناة السويس، بحيرة التمساح.</p>
                <p className="en-text">Car rental in Ismailia with driver. Suez Canal, Lake Timsah.</p>
              </div>
              <div className="gov-card">
                <h4>دمياط</h4>
                <p>تأجير سيارات في دمياط مع سائق. ميناء دمياط، رأس البر.</p>
                <p className="en-text">Car rental in Damietta with driver. Damietta port, Ras El-Bar.</p>
              </div>
              <div className="gov-card">
                <h4>المنيا</h4>
                <p>سيارات للإيجار في المنيا مع سائق. آثار تل العمارنة.</p>
                <p className="en-text">Car rental in Minya with driver. Tell El-Amarna ruins.</p>
              </div>
              <div className="gov-card">
                <h4>بني سويف</h4>
                <p>تأجير سيارات في بني سويف مع سائق. تنقلات يومية، رحلات للصعيد.</p>
                <p className="en-text">Car rental in Beni Suef with driver. Daily transportation.</p>
              </div>
              <div className="gov-card">
                <h4>الفيوم</h4>
                <p>سيارات للإيجار في الفيوم مع سائق. بحيرة قارون، وادي الريان.</p>
                <p className="en-text">Car rental in Fayoum with driver. Lake Qarun, Wadi El-Rayan.</p>
              </div>
              <div className="gov-card">
                <h4>أسيوط</h4>
                <p>تأجير سيارات في أسيوط مع سائق. دير المحرق.</p>
                <p className="en-text">Car rental in Asyut with driver. Deir El-Muharraq.</p>
              </div>
              <div className="gov-card">
                <h4>سوهاج</h4>
                <p>سيارات للإيجار في سوهاج مع سائق. معبد أبيدوس.</p>
                <p className="en-text">Car rental in Sohag with driver. Abydos Temple.</p>
              </div>
              <div className="gov-card">
                <h4>قنا</h4>
                <p>تأجير سيارات في قنا مع سائق. معبد دندرة.</p>
                <p className="en-text">Car rental in Qena with driver. Dendera Temple.</p>
              </div>
              <div className="gov-card">
                <h4>مرسى مطروح</h4>
                <p>سيارات للإيجار في مرسى مطروح مع سائق. الساحل الشمالي، شواطئ البحر المتوسط.</p>
                <p className="en-text">Car rental in Marsa Matruh with driver. North Coast, Mediterranean beaches.</p>
              </div>
              <div className="gov-card">
                <h4>دهب / جنوب سيناء</h4>
                <p>تأجير سيارات في دهب مع سائق. الغوص، رحلات سفاري، جبل موسى.</p>
                <p className="en-text">Car rental in Dahab with driver. Diving, safaris, Mount Sinai.</p>
              </div>
              <div className="gov-card">
                <h4>نويبع / جنوب سيناء</h4>
                <p>سيارات للإيجار في نويبع مع سائق. شواطئ، رحلات بحرية.</p>
                <p className="en-text">Car rental in Nuweiba with driver. Beaches, boat trips.</p>
              </div>
              <div className="gov-card">
                <h4>طابا / جنوب سيناء</h4>
                <p>تأجير سيارات في طابا مع سائق. منتجعات سياحية، شواطئ.</p>
                <p className="en-text">Car rental in Taba with driver. Resorts, beaches.</p>
              </div>
              <div className="gov-card">
                <h4>الجونة / البحر الأحمر</h4>
                <p>سيارات للإيجار في الجونة مع سائق. منتجع سياحي، جولات بحرية.</p>
                <p className="en-text">Car rental in El Gouna with driver. Tourist resort, boat tours.</p>
              </div>
              <div className="gov-card">
                <h4>سفاجا / البحر الأحمر</h4>
                <p>تأجير سيارات في سفاجا مع سائق. شواطئ، ميناء.</p>
                <p className="en-text">Car rental in Safaga with driver. Beaches, port.</p>
              </div>
              <div className="gov-card">
                <h4>القصير / البحر الأحمر</h4>
                <p>سيارات للإيجار في القصير مع سائق. شواطئ، آثار.</p>
                <p className="en-text">Car rental in El-Quseir with driver. Beaches, ruins.</p>
              </div>
              <div className="gov-card">
                <h4>سانت كاترين / جنوب سيناء</h4>
                <p>تأجير سيارات في سانت كاترين مع سائق. جبل موسى، دير سانت كاترين.</p>
                <p className="en-text">Car rental in St. Catherine with driver. Mount Sinai, St. Catherine Monastery.</p>
              </div>
            </div>
          </div>
        </div>

        <h2>خدمات مطارات مصر – Airport Services in Egypt</h2>
        <div className="seo-bilingual-section">
          <div className="seo-arabic">
            <p>
              نقدم خدمات <strong>تأجير السيارات في مطارات مصر</strong>، حيث نستقبلك عند وصولك إلى أي مطار من مطارات مصر:
            </p>
            <ul>
              <li><strong>مطار القاهرة الدولي</strong> – خدمة استقبال وتوصيل إلى أي مكان في القاهرة.</li>
              <li><strong>مطار الإسكندرية</strong> – خدمة استقبال وتوصيل إلى أي مكان في الإسكندرية والساحل الشمالي.</li>
              <li><strong>مطار الغردقة الدولي</strong> – خدمة استقبال وتوصيل إلى أي مكان في الغردقة والجونة.</li>
              <li><strong>مطار شرم الشيخ الدولي</strong> – خدمة استقبال وتوصيل إلى أي مكان في شرم الشيخ ودهب.</li>
              <li><strong>مطار الأقصر الدولي</strong> – خدمة استقبال وتوصيل إلى أي مكان في الأقصر.</li>
              <li><strong>مطار أسوان الدولي</strong> – خدمة استقبال وتوصيل إلى أي مكان في أسوان.</li>
              <li><strong>مطار بورسعيد</strong> – خدمة استقبال وتوصيل إلى أي مكان في بورسعيد.</li>
              <li><strong>مطار مرسى مطروح</strong> – خدمة استقبال وتوصيل إلى أي مكان في مرسى مطروح والساحل الشمالي.</li>
            </ul>
          </div>
          <div className="seo-english">
            <p>
              We offer <strong>car rental services at Egyptian airports</strong>, where we pick you up upon your arrival at any of Egypt's airports:
            </p>
            <ul>
              <li><strong>Cairo International Airport</strong> – Pickup and drop-off service to anywhere in Cairo.</li>
              <li><strong>Alexandria Airport</strong> – Pickup and drop-off service to anywhere in Alexandria and the North Coast.</li>
              <li><strong>Hurghada International Airport</strong> – Pickup and drop-off service to anywhere in Hurghada and El Gouna.</li>
              <li><strong>Sharm El-Sheikh International Airport</strong> – Pickup and drop-off service to anywhere in Sharm El-Sheikh and Dahab.</li>
              <li><strong>Luxor International Airport</strong> – Pickup and drop-off service to anywhere in Luxor.</li>
              <li><strong>Aswan International Airport</strong> – Pickup and drop-off service to anywhere in Aswan.</li>
              <li><strong>Port Said Airport</strong> – Pickup and drop-off service to anywhere in Port Said.</li>
              <li><strong>Marsa Matruh Airport</strong> – Pickup and drop-off service to anywhere in Marsa Matruh and the North Coast.</li>
            </ul>
          </div>
        </div>

        <h2>مميزات خدمات Roadex – Roadex Service Features</h2>
        <div className="seo-bilingual-section">
          <div className="seo-arabic">
            <ul>
              <li><strong>سيارات حديثة ومتنوعة</strong> – من السيارات الاقتصادية إلى الفاخرة.</li>
              <li><strong>أسعار تنافسية</strong> – عروض خاصة وحزم توفير على الإيجار الطويل.</li>
              <li><strong>سائقين محترفين</strong> – مدربين على أعلى مستوى، يتحدثون العربية والإنجليزية.</li>
              <li><strong>خدمة 24 ساعة</strong> – دعم فني وخدمة عملاء على مدار الساعة.</li>
              <li><strong>حجز سهل وسريع</strong> – من خلال موقعنا الإلكتروني أو تطبيق الهاتف المحمول.</li>
              <li><strong>تأمين شامل</strong> – جميع سياراتنا مؤمنة ضد الغير والحوادث.</li>
              <li><strong>مرونة في الإيجار</strong> – إيجار يومي، أسبوعي، شهري.</li>
            </ul>
          </div>
          <div className="seo-english">
            <ul>
              <li><strong>Modern and diverse cars</strong> – From economy to luxury vehicles.</li>
              <li><strong>Competitive prices</strong> – Special offers and savings packages for long-term rental.</li>
              <li><strong>Professional drivers</strong> – Highly trained, speaking Arabic and English.</li>
              <li><strong>24/7 Service</strong> – Technical support and customer service around the clock.</li>
              <li><strong>Easy and fast booking</strong> – Through our website or mobile app.</li>
              <li><strong>Comprehensive insurance</strong> – All our cars are insured against third parties and accidents.</li>
              <li><strong>Flexible rental</strong> – Daily, weekly, monthly rental.</li>
            </ul>
          </div>
        </div>

        {/* =========================
            FAQ SECTION
        ========================= */}
        <div className="seo-faq-box">
          <h2>الأسئلة الشائعة – Frequently Asked Questions</h2>
          
          <div className="faq-item">
            <h4>ما هي شروط تأجير السيارة في مصر؟</h4>
            <h4>What are the requirements for car rental in Egypt?</h4>
            <p>يشترط أن يكون عمر العميل فوق 21 عامًا، مع تقديم بطاقة هوية سارية ورخصة قيادة صالحة. للسياح، يتم تقديم جواز السفر وتأشيرة الدخول.</p>
            <p>The customer must be over 21 years old, with a valid ID and driver's license. Tourists must provide a passport and entry visa.</p>
          </div>

          <div className="faq-item">
            <h4>هل يمكنني استئجار سيارة مع سائق؟</h4>
            <h4>Can I rent a car with a driver?</h4>
            <p>نعم، نوفر <strong>سيارات مع سائق</strong> بأسعار تنافسية. يمكنك حجز السيارة مع سائق محترف من خلال موقعنا.</p>
            <p>Yes, we provide <strong>cars with drivers</strong> at competitive prices. You can book a car with a professional driver through our website.</p>
          </div>

          <div className="faq-item">
            <h4>ما هي أسعار تأجير السيارات في مصر؟</h4>
            <h4>What are the car rental prices in Egypt?</h4>
            <p>تختلف الأسعار حسب موديل السيارة، مدة الإيجار، والخدمات الإضافية مثل السائق. تبدأ الأسعار من 500 جنيه مصري يوميًا للسيارات الاقتصادية.</p>
            <p>Prices vary depending on the car model, rental duration, and additional services such as the driver. Prices start from 500 EGP per day for economy cars.</p>
          </div>

          <div className="faq-item">
            <h4>كيف يمكنني الحجز؟</h4>
            <h4>How can I book?</h4>
            <p>يمكنك الحجز من خلال موقعنا الإلكتروني <strong>Roadex</strong>، أو الاتصال بنا على رقم الواتساب الموجود في الموقع.</p>
            <p>You can book through our website <strong>Roadex</strong>, or contact us via the WhatsApp number on the site.</p>
          </div>

          <div className="faq-item">
            <h4>هل التأمين مشمول في السعر؟</h4>
            <h4>Is insurance included in the price?</h4>
            <p>نعم، جميع عقود الإيجار تشمل تأمينًا أساسيًا ضد الغير. يمكن إضافة تأمين شامل إضافي حسب طلب العميل.</p>
            <p>Yes, all rental contracts include basic third-party insurance. Additional comprehensive insurance can be added upon customer request.</p>
          </div>

          <div className="faq-item">
            <h4>هل توفرون خدمة توصيل السيارة إلى المطار؟</h4>
            <h4>Do you provide car delivery to the airport?</h4>
            <p>نعم، نوفر خدمة توصيل السيارة إلى جميع مطارات مصر، بما في ذلك مطار القاهرة، الإسكندرية، الغردقة، شرم الشيخ، الأقصر، وأسوان.</p>
            <p>Yes, we provide car delivery service to all Egyptian airports, including Cairo, Alexandria, Hurghada, Sharm El-Sheikh, Luxor, and Aswan.</p>
          </div>

          <div className="faq-item">
            <h4>هل يمكنني استئجار سيارة للسفر بين المحافظات؟</h4>
            <h4>Can I rent a car for travel between governorates?</h4>
            <p>نعم، يمكنك استئجار سيارة للسفر بين جميع محافظات مصر. نوفر سيارات مناسبة للسفر الطويل مع سائقين محترفين.</p>
            <p>Yes, you can rent a car for travel between all governorates of Egypt. We provide cars suitable for long-distance travel with professional drivers.</p>
          </div>

          <div className="faq-item">
            <h4>ما هي طرق الدفع المتاحة؟</h4>
            <h4>What payment methods are available?</h4>
            <p>نقبل الدفع نقدًا، وتحويلات بنكية، وبطاقات الائتمان، والمحافظ الإلكترونية.</p>
            <p>We accept cash, bank transfers, credit cards, and e-wallets.</p>
          </div>

          <div className="faq-item">
            <h4>هل يمكنني إلغاء الحجز؟</h4>
            <h4>Can I cancel my booking?</h4>
            <p>نعم، يمكنك إلغاء الحجز قبل 24 ساعة من موعد الاستلام لاسترداد المبلغ بالكامل. في حالة الإلغاء خلال أقل من 24 ساعة، يتم خصم 30% من قيمة الحجز.</p>
            <p>Yes, you can cancel your booking 24 hours before pickup for a full refund. Cancellations within less than 24 hours will incur a 30% charge.</p>
          </div>

          <div className="faq-item">
            <h4>هل توجد رسوم خفية؟</h4>
            <h4>Are there any hidden fees?</h4>
            <p>لا، جميع الأسعار المعروضة شاملة التأمين الأساسي والضرائب والرسوم. لا توجد رسوم خفية أو إضافية.</p>
            <p>No, all displayed prices include basic insurance, taxes, and fees. There are no hidden or additional charges.</p>
          </div>

          <div className="faq-item">
            <h4>كم عدد الكيلومترات المسموح بها يوميًا؟</h4>
            <h4>How many kilometers are allowed per day?</h4>
            <p>يسمح بـ 150 كيلومتر يوميًا للسيارات السيدان والـ SUV. في حالة تجاوز الحد المسموح، يتم احتساب 5 جنيه لكل كيلومتر إضافي.</p>
            <p>150 kilometers per day are allowed for sedan and SUV cars. Additional kilometers are charged at 5 EGP per kilometer.</p>
          </div>

          <div className="faq-item">
            <h4>هل يمكنني استئجار سيارة لشخص آخر؟</h4>
            <h4>Can I rent a car for someone else?</h4>
            <p>نعم، يمكنك استئجار سيارة لشخص آخر بشرط تقديم جميع المستندات المطلوبة للشخص المستأجر.</p>
            <p>Yes, you can rent a car for someone else, provided all required documents for the renter are submitted.</p>
          </div>

          <div className="faq-item">
            <h4>ما هي عقوبة التأخير في الإرجاع؟</h4>
            <h4>What is the late return penalty?</h4>
            <p>في حالة التأخير في إرجاع السيارة، يتم احتساب 100 جنيه عن كل ساعة تأخير، أو يوم إضافي كامل حسب السعر اليومي.</p>
            <p>In case of late return, a fee of 100 EGP per hour will be charged, or a full extra day at the daily rate.</p>
          </div>

          <div className="faq-item">
            <h4>هل يمكنني استئجار سيارة للأغراض التجارية؟</h4>
            <h4>Can I rent a car for business purposes?</h4>
            <p>نعم، نوفر سيارات مناسبة للأغراض التجارية والشركات، مع عروض خاصة للشركات والعملاء الدائمين.</p>
            <p>Yes, we provide cars suitable for business purposes and companies, with special offers for corporate clients.</p>
          </div>
        </div>

        <div className="seo-keywords-box">
          <h3>الكلمات المفتاحية – Keywords</h3>
          <div className="keywords-tags">
            <span>تأجير سيارات مصر</span>
            <span>سيارة مع سائق</span>
            <span>إيجار سيارات القاهرة</span>
            <span>إيجار سيارات الإسكندرية</span>
            <span>إيجار سيارات الغردقة</span>
            <span>إيجار سيارات شرم الشيخ</span>
            <span>إيجار سيارات الأقصر</span>
            <span>إيجار سيارات أسوان</span>
            <span>إيجار سيارات بورسعيد</span>
            <span>إيجار سيارات السويس</span>
            <span>إيجار سيارات المنصورة</span>
            <span>إيجار سيارات طنطا</span>
            <span>إيجار سيارات الزقازيق</span>
            <span>إيجار سيارات الإسماعيلية</span>
            <span>إيجار سيارات دمياط</span>
            <span>إيجار سيارات المنيا</span>
            <span>إيجار سيارات بني سويف</span>
            <span>إيجار سيارات الفيوم</span>
            <span>إيجار سيارات أسيوط</span>
            <span>إيجار سيارات سوهاج</span>
            <span>إيجار سيارات قنا</span>
            <span>إيجار سيارات مرسى مطروح</span>
            <span>إيجار سيارات دهب</span>
            <span>إيجار سيارات نويبع</span>
            <span>إيجار سيارات طابا</span>
            <span>إيجار سيارات الجونة</span>
            <span>إيجار سيارات سفاجا</span>
            <span>إيجار سيارات القصير</span>
            <span>إيجار سيارات سانت كاترين</span>
            <span>Roadex</span>
            <span>chauffeur service Egypt</span>
            <span>car rental Egypt</span>
            <span>luxury car rental</span>
            <span>affordable car rental</span>
            <span>سيارة للإيجار</span>
            <span>تأجير سيارات مطار القاهرة</span>
            <span>تأجير سيارات مطار الغردقة</span>
            <span>تأجير سيارات مطار شرم الشيخ</span>
            <span>تأجير سيارات مطار الأقصر</span>
            <span>تأجير سيارات مطار أسوان</span>
            <span>أفضل شركة تأجير سيارات</span>
            <span>car rental with driver</span>
            <span>car rental without driver</span>
            <span>Egypt car hire</span>
            <span>Cairo car rental</span>
            <span>سيارات للايجار بالاسكندرية</span>
            <span>سيارات للايجار بالغردقة</span>
            <span>سيارات للايجار بشرم الشيخ</span>
            <span>تأجير سيارات شهرية</span>
            <span>تأجير سيارات بالسائق</span>
            <span>سيارة مع سواق</span>
            <span>أحسن عربية للإيجار</span>
            <span>سعر إيجار السيارة في مصر</span>
            <span>Best car rental Egypt</span>
            <span>Car rental Cairo</span>
            <span>Roadex car rental</span>
            <span>Chauffeur driven car</span>
            <span>Rent a car Egypt</span>
            <span>جولة سياحية في مصر</span>
            <span>رحلات سياحية في القاهرة</span>
            <span>سياحة الأقصر</span>
            <span>سياحة أسوان</span>
            <span>الغردقة جولات</span>
            <span>شرم الشيخ جولات</span>
            <span>الساحل الشمالي</span>
            <span>العين السخنة</span>
            <span>مرسى مطروح</span>
            <span>دهب</span>
            <span>نويبع</span>
            <span>طابا</span>
            <span>الجونة</span>
            <span>سفاجا</span>
            <span>القصير</span>
            <span>رأس غارب</span>
            <span>الزعفرانة</span>
            <span>الطور</span>
            <span>سانت كاترين</span>
            <span>سيناء</span>
            <span>البحر الأحمر</span>
            <span>الصعيد</span>
            <span>الدلتا</span>
            <span>شروط تأجير السيارات</span>
            <span>أسعار تأجير السيارات</span>
            <span>إلغاء حجز سيارة</span>
            <span>تأمين السيارة</span>
            <span>توصيل سيارة للمطار</span>
            <span>car rental requirements</span>
            <span>car rental prices Egypt</span>
            <span>car rental cancellation policy</span>
            <span>car insurance Egypt</span>
            <span>airport car delivery</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SEOKeywords;