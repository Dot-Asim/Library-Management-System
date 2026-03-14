package com.ulms.search.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(indexName = "books")
public class BookDocument {

    @Id
    private String id;

    @Field(type = FieldType.Text, analyzer = "english")
    private String title;

    @Field(type = FieldType.Keyword)
    private String isbn;

    @Field(type = FieldType.Keyword)
    private String language;

    @Field(type = FieldType.Integer)
    private Integer pageCount;

    @Field(type = FieldType.Keyword)
    private String coverImageUrl;
}
