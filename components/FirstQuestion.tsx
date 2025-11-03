import React, { useState } from 'react';

// ----------------------------------------------------------------------
// 💡 ステップインジケーター
// ----------------------------------------------------------------------
const StepIndicator = ({ step }) => {
  // step 1 (isAgreed=false) は左の丸が青
  // step 2 (isAgreed=true) は右の丸が青
  return (
    <div className='flex justify-center space-x-2 mt-4 mb-4'> 
      {/* 1枚目の丸 */}
      <div 
        className={`w-3 h-3 rounded-full transition-colors duration-300 ${
          step === 1 ? 'bg-blue-500' : 'bg-gray-300' // step 1 なら青
        }`}
      ></div>
      {/* 2枚目の丸 */}
      <div 
        className={`w-3 h-3 rounded-full transition-colors duration-300 ${
          step === 2 ? 'bg-blue-500' : 'bg-gray-300' // step 2 なら青
        }`}
      ></div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 💡 アレルギー質問コンテンツ (ボタンのmt-6を削除し、StepIndicatorに場所を譲る)
// ----------------------------------------------------------------------
const AllergyQuestionContent = ({ onAnswer }) => (
  <div className='text-center flex flex-col justify-between items-center h-full p-4'>
    {/* ... 質問と説明文 ... */}
    <div className='flex flex-col items-center mt-12'>
      <h1 className='text-2xl font-bold mb-5 mt-10 text-gray-800'>
        アレルギーはありますか？
      </h1>
      <p className='text-base text-gray-700'>
        アレルゲンの有無も併せて確認できます。
      </p>
    </div>

    {/* ボタンコンテナ (mb-12を削除し、インジケーターに場所を譲る) */}
    <div className='w-full space-y-4'> 
      <button
        onClick={() => onAnswer('yes')}
        className='bg-red-500 text-white font-bold py-4 px-4 rounded-lg hover:bg-red-700 transition duration-150 w-full shadow-lg'
      >
        ある
      </button>
      <button
        onClick={() => onAnswer('no')}
        className='bg-green-500 text-white font-bold py-4 px-4 rounded-lg hover:bg-green-700 transition duration-150 w-full shadow-lg'
      >
        ない
      </button>
    </div>
  </div>
);


// ----------------------------------------------------------------------
// 💡 規約同意コンテンツ (ボタンのmt-6を削除し、StepIndicatorに場所を譲る)
// ----------------------------------------------------------------------
const AgreementContent = ({ handleAgreement }) => (
  <>
    <div className='text-center flex flex-col flex-grow'>
      <h1 className='text-2xl font-bold mb-5 mt-10'>
          利用規約に同意しますか？
        </h1>
        
        {/* 規約テキストエリア (レイアウト改善のために flex-grow を追加することを推奨) */}
        <div className='mt-8 text-left h-full overflow-y-auto'>
          <p className='text-sm text-gray-600'>
            本サービスを利用することにより、以下の利用規約に同意したものとみなされます。利用規約の全文をよくお読みください。 
            <br/><br/>
            第1条 (目的): 本サービスは、ハラールおよびアレルゲンの情報提供を目的とします。
            <br/><br/>
            第2条 (免責事項): 提供される情報は正確性を期していますが、最終的な判断は利用者の責任において行ってください。
            <br/><br/>
            第3条 (個人情報): 利用者の個人情報は、プライバシーポリシーに基づき適切に取り扱われます。

          </p>
      </div>
    </div>
    
    {/* ボタン (mt-6を削除) */}
    <div className='text-center w-full'>
      <button 
        className='bg-blue-500 text-white font-bold py-3 px-4 rounded hover:bg-blue-700 transition duration-150 w-full'
        onClick={handleAgreement} 
      >
        OK
      </button>
    </div>
  </>
);


// ----------------------------------------------------------------------
// 💡 FirstQuestion コンポーネント (インジケーターを表示)
// ----------------------------------------------------------------------
const FirstQuestion = ({ onAllergyAnswer }) => { 
  const [isAgreed, setIsAgreed] = useState(false);
  
  // 💡 現在のステップを計算 (false=1, true=2)
  const currentStep = isAgreed ? 2 : 1;

  const handleAgreement = () => {
    setIsAgreed(true);
  };

  return (
    <div 
      className='bg-white p-8 rounded-lg shadow-xl w-[350px] mx-auto h-[700px] flex flex-col justify-between'
    >
      {/* 1. コンテンツの表示 */}
      <div className='flex flex-col flex-grow justify-between'>
        {currentStep === 1 
          ? <AgreementContent handleAgreement={handleAgreement} />
          : <AllergyQuestionContent onAnswer={onAllergyAnswer} />
        }
      </div>
      
      {/* 2. インジケーターの表示 */}
      <StepIndicator step={currentStep} /> 
    </div>
  );
};

export { FirstQuestion };