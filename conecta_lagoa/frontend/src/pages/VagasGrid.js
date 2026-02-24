import { useState } from 'react';
import { MapPin, Clock, DollarSign } from 'lucide-react';

function VagaCard({ vaga, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow duration-200 
                 border border-gray-200 overflow-hidden cursor-pointer group"
    >
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
          {vaga.titulo}
        </h3>
        
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            <span>{vaga.local}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{vaga.modelo || 'Presencial'}</span>
          </div>
          {vaga.salario && (
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" />
              <span>{vaga.salario}</span>
            </div>
          )}
        </div>

        <p className="mt-4 text-gray-600 line-clamp-3">
          {vaga.descricao}
        </p>

        <div className="mt-5">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {vaga.tipo || 'CLT'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function VagasGrid({ vagas }) {
  const [selectedVaga, setSelectedVaga] = useState(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vagas.map(vaga => (
          <VagaCard 
            key={vaga.id || vaga._id} 
            vaga={vaga} 
            onClick={() => setSelectedVaga(vaga)}
          />
        ))}
      </div>

      {/* Modal simples de detalhes (opcional – pode melhorar depois) */}
      {selectedVaga && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold">{selectedVaga.titulo}</h2>
                <button 
                  onClick={() => setSelectedVaga(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="mt-6 space-y-6">
                {/* Aqui você coloca mais detalhes da vaga */}
                <p className="text-gray-700 whitespace-pre-line">
                  {selectedVaga.descricaoCompleta || selectedVaga.descricao}
                </p>

                <button className="w-full md:w-auto bg-blue-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-blue-700 transition">
                  Candidatar-se a esta vaga
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}